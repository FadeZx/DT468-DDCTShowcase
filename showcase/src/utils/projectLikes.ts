// Utility functions for project likes

export async function getProjectLikeCounts(supabase: any, projectIds: string[]) {
  if (!projectIds.length) return {};

  try {
    const { data, error } = await supabase
      .from('project_likes')
      .select('project_id')
      .in('project_id', projectIds);

    if (error) throw error;

    // Count likes per project
    const likeCounts = data?.reduce((acc: Record<string, number>, like: any) => {
      acc[like.project_id] = (acc[like.project_id] || 0) + 1;
      return acc;
    }, {}) || {};

    return likeCounts;
  } catch (error) {
    console.error('Error fetching project like counts:', error);
    return {};
  }
}

export async function getUserProjectLikes(supabase: any, projectIds: string[], userId: string) {
  if (!projectIds.length || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('project_likes')
      .select('project_id')
      .in('project_id', projectIds)
      .eq('user_id', userId);

    if (error) throw error;

    return data?.map((like: any) => like.project_id) || [];
  } catch (error) {
    console.error('Error fetching user project likes:', error);
    return [];
  }
}