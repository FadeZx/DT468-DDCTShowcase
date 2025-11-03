import { useState, useEffect } from 'react';

interface UseProjectLikesProps {
  projectId: string;
  currentUser: any;
  supabase: any;
  onLikeChange?: () => void;
}

export function useProjectLikes({ projectId, currentUser, supabase, onLikeChange }: UseProjectLikesProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLikes();
  }, [projectId, currentUser]);

  const loadLikes = async () => {
    try {
      setLoading(true);
      
      // Get total likes count
      const { count, error: countError } = await supabase
        .from('project_likes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (countError) throw countError;
      setLikesCount(count || 0);

      // Check if current user has liked this project
      if (currentUser) {
        const { data: userLike, error: likeError } = await supabase
          .from('project_likes')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', currentUser.id)
          .single();

        if (likeError && likeError.code !== 'PGRST116') throw likeError;
        setIsLiked(!!userLike);
      } else {
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Error loading project likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!currentUser) return;

    try {
      // Optimistically update UI
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);

      if (wasLiked) {
        // Unlike
        const { error } = await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', currentUser.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('project_likes')
          .insert({
            project_id: projectId,
            user_id: currentUser.id
          });
        
        if (error) throw error;
      }

      // Call the callback to refresh project data
      if (onLikeChange) {
        onLikeChange();
      }
    } catch (error) {
      console.error('Error toggling project like:', error);
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  return {
    likesCount,
    isLiked,
    loading,
    toggleLike
  };
}