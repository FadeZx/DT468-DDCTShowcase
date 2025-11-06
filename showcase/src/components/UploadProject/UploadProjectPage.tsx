import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import supabase from '../../utils/supabase/client';
import { Plus, X, Users } from 'lucide-react';

interface UploadProjectPageProps {
  currentUser?: any;
  projectId?: string;
  onProjectCreated?: () => void;
  onProjectUpdated?: () => void;
  initialProject?: any;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export default function UploadProjectPage({
  currentUser,
  projectId: editProjectId,
  onProjectUpdated,
}: UploadProjectPageProps = {}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [newMember, setNewMember] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editProjectId) {
      loadMembers();
    }
  }, [editProjectId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data: memberLinks } = await supabase
        .from('project_collaborators')
        .select('user_id, role')
        .eq('project_id', editProjectId);

      if (memberLinks?.length) {
        const memberIds = memberLinks.map(link => link.user_id);
        const { data: memberProfiles } = await supabase
          .from('profiles')
          .select('id, name, email, avatar')
          .in('id', memberIds);

        const memberEntries = (memberProfiles || []).map(profile => {
          const link = memberLinks.find(l => l.user_id === profile.id);
          return {
            id: profile.id,
            name: profile.name || profile.email || 'Member',
            email: profile.email || '',
            role: link?.role || 'editor',
            avatar: profile.avatar || null,
          };
        });

        setMembers(memberEntries);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMember.trim()) return;

    try {
      // Search for user by email or username
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar')
        .or(`email.eq.${newMember.trim()},name.ilike.%${newMember.trim()}%`);

      if (error) throw error;

      if (users && users.length > 0) {
        const user = users[0];
        if (!members.some(member => member.id === user.id)) {
          setMembers(prev => [
            ...prev,
            {
              id: user.id,
              name: user.name || user.email || 'Member',
              email: user.email || '',
              role: 'editor',
              avatar: user.avatar || null,
            }
          ]);
          setNewMember('');
        } else {
          alert('User is already a member');
        }
      } else {
        alert('User not found');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      alert('Error searching for user');
    }
  };

  const removeMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('You must be logged in to manage project members');
      return;
    }

    if (!editProjectId) {
      alert('No project ID provided');
      return;
    }

    setIsUploading(true);

    try {
      // Delete existing collaborators for this project
      await supabase
        .from('project_collaborators')
        .delete()
        .eq('project_id', editProjectId);

      // Insert new collaborators
      if (members.length > 0) {
        const memberRows = members.map(member => ({
          project_id: editProjectId,
          user_id: member.id,
          role: member.role || 'editor',
          invited_by: currentUser.id
        }));

        const { error: memberErr } = await supabase
          .from('project_collaborators')
          .insert(memberRows);

        if (memberErr) throw memberErr;
      }

      alert('Project members updated successfully!');
      onProjectUpdated?.();
      window.location.href = '/';
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to update project members');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading project data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Project Members
          </h1>
          <p className="text-gray-600">
            Invite team members to collaborate on this project
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Add Member by Email</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email address"
                        value={newMember}
                        onChange={(e) => setNewMember(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addMember()}
                        className="flex-1"
                      />
                      <Button onClick={addMember} size="default">
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter the email address of an existing user. They will be added immediately without needing to accept.
                    </p>
                  </div>

                  {members.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Project Members ({members.length})</h3>
                      <div className="space-y-2">
                        {members.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={member.avatar || undefined} />
                                <AvatarImage src="/placeholder-avatar.svg" />
                                <AvatarFallback>
                                  {member.name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(member.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {members.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No members added yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add members by entering their email above</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            size="lg"
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Save Members
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
