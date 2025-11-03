import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  MessageCircle, 
  Heart, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  likes_count?: number;
  is_liked?: boolean;
}

interface ProjectCommentsProps {
  projectId: string;
  currentUser: any;
  supabase: any;
}

export function ProjectComments({ projectId, currentUser, supabase }: ProjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      
      // Fetch only root comments (no replies)
      const { data: commentsData, error } = await supabase
        .from('project_comments')
        .select(`
          *,
          user:profiles(id, name, avatar, role)
        `)
        .eq('project_id', projectId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get comment IDs to fetch likes
      const commentIds = commentsData?.map(c => c.id) || [];
      
      // Fetch like counts for all comments
      const { data: likesData } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);

      // Fetch current user's likes
      const userLikes = currentUser ? 
        (likesData?.filter(like => like.user_id === currentUser.id).map(like => like.comment_id) || []) : 
        [];

      // Count likes per comment
      const likeCounts = likesData?.reduce((acc, like) => {
        acc[like.comment_id] = (acc[like.comment_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Create simple comment objects (no threading)
      const processedComments: Comment[] = commentsData?.map((comment) => ({
        ...comment,
        likes_count: likeCounts[comment.id] || 0,
        is_liked: userLikes.includes(comment.id)
      })) || [];

      setComments(processedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: currentUser.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };



  const editComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('project_comments')
        .update({
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      setEditingComment(null);
      setEditContent('');
      await loadComments();
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment. Please try again.');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };



  const toggleCommentLike = async (commentId: string) => {
    if (!currentUser) return;

    try {
      // Find the comment in our state
      const findAndUpdateComment = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const wasLiked = comment.is_liked;
            return {
              ...comment,
              is_liked: !wasLiked,
              likes_count: wasLiked ? comment.likes_count! - 1 : comment.likes_count! + 1
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: findAndUpdateComment(comment.replies)
            };
          }
          return comment;
        });
      };

      // Optimistically update UI
      setComments(prevComments => findAndUpdateComment(prevComments));

      // Get current like status
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id
          });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Revert optimistic update on error
      await loadComments();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white';
      case 'student': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const CommentItem = ({ comment }: { comment: Comment }) => {
    const canEdit = currentUser?.id === comment.user_id;
    const canDelete = currentUser?.id === comment.user_id || currentUser?.role === 'admin';

    return (
      <div>
        <Card className="mb-4">
          <CardContent className="p-4">
            {/* Comment Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.user.avatar} />
                  <AvatarFallback>
                    {comment.user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.user.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-2 py-0 ${getRoleBadgeColor(comment.user.role)}`}
                  >
                    {comment.user.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(comment.created_at)}
                    {comment.is_edited && ' (edited)'}
                  </span>
                </div>
              </div>

              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => deleteComment(comment.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Comment Content */}
            {editingComment === comment.id ? (
              <div className="space-y-3">
                <Textarea
                  key={`edit-${comment.id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  className="min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => editComment(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <p className="text-sm leading-relaxed break-words comment-content">
                  {comment.content}
                </p>
              </div>
            )}

            {/* Comment Actions */}
            {editingComment !== comment.id && (
              <div className="flex items-center gap-4 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-0 transition-colors ${
                    comment.is_liked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => toggleCommentLike(comment.id)}
                  disabled={!currentUser}
                >
                  <Heart className={`h-4 w-4 mr-1 transition-all ${
                    comment.is_liked ? 'fill-current' : ''
                  }`} />
                  {comment.likes_count || 0}
                </Button>


              </div>
            )}


          </CardContent>
        </Card>


      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Comments</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      {currentUser ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  key="main-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this project..."
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Be respectful and constructive in your feedback
                  </p>
                  <Button 
                    onClick={submitComment}
                    disabled={!newComment.trim() || submitting}
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground mb-3">Sign in to leave a comment</p>
            <Button variant="outline">Sign In</Button>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-medium mb-2">No comments yet</h4>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts about this project!
              </p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}