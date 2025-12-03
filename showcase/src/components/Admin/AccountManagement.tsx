import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge-simple';
import supabase from '../../utils/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  year: string;
  role: 'student' | 'partner' | 'admin';
  avatar?: string;
  bio?: string;
  skills?: string[];
  created_at: string;
  status?: 'active' | 'inactive';
}

interface CreateAccountFormData {
  name: string;
  email: string;
  password: string;
  year: string;
  role: 'student' | 'partner' | 'admin';
}

interface AccountManagementProps {
  onAccountCreated?: () => void;
}

const ALLOWED_PROFILE_ROLES = ['admin', 'student', 'guest'] as const;
type AllowedProfileRole = (typeof ALLOWED_PROFILE_ROLES)[number];

const normalizeProfileRole = (role: string | null | undefined): AllowedProfileRole => {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'student' || r === 'partner' || r === 'teacher') return 'student';
  return 'guest';
};

const getDisplayRole = (user: User): 'student' | 'partner' | 'admin' => {
  if (user.role === 'admin') return 'admin';
  // Partner accounts are stored as role 'student' but have no year
  if (user.role === 'student' && (!user.year || user.year === 'Unknown')) return 'partner';
  return 'student';
};

// Use app-wide Supabase client instance for regular operations

export function AccountManagement({ onAccountCreated }: AccountManagementProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'partner' | 'admin'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [showServiceRoleInput, setShowServiceRoleInput] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateAccountFormData>({
    name: '',
    email: '',
    password: '',
    year: '68',
    role: 'student'
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: 'student' | 'partner' | 'admin';
    year: string;
  }>({ name: '', email: '', role: 'student', year: '68' });
  const [newPassword, setNewPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    loadAccounts();
    try {
      const storedKey = localStorage.getItem('supabase_service_role_key');
      if (storedKey) {
        setServiceRoleKey(storedKey);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.year.includes(searchTerm)
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => getDisplayRole(user) === filterRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAccountWithServiceRole = async () => {
    const key = serviceRoleKey || (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined);
    if (!key) {
      setShowServiceRoleInput(true);
      alert('Account creation is not configured. Please enter your Supabase service role key.');
      return;
    }

    setLoading(true);
    try {
      const adminClient = createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        key,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data, error } = await adminClient.auth.admin.createUser({
        email: createFormData.email,
        password: createFormData.password,
        user_metadata: {
          name: createFormData.name,
          role: createFormData.role, // keep full semantic role in metadata
          year: createFormData.role === 'student' ? createFormData.year : null
        },
        email_confirm: true
      });

      if (error) throw error;

      if (data.user) {
        const profileRow = {
          id: data.user.id,
          email: createFormData.email,
          name: createFormData.name,
          // DB constraint only allows admin | student | guest
          role: normalizeProfileRole(createFormData.role),
          year: createFormData.role === 'student' ? createFormData.year : null,
          bio: `${createFormData.role.charAt(0).toUpperCase() + createFormData.role.slice(1)} at DDCT`,
          skills: [] as string[],
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileRow);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Optimistically add to local state so it shows immediately
        const newUser: User = {
          id: profileRow.id,
          name: profileRow.name,
          email: profileRow.email,
          year: profileRow.year,
          role: profileRow.role as User['role'],
          avatar: undefined,
          bio: profileRow.bio,
          skills: profileRow.skills,
          created_at: new Date().toISOString(),
          status: 'active',
        };
        setUsers((prev) => [newUser, ...prev]);
      }

      alert(`Account created.\nEmail: ${createFormData.email}\nPassword: ${createFormData.password}`);

      setCreateFormData({
        name: '',
        email: '',
        password: '',
        year: '68',
        role: 'student'
      });
      setShowCreateForm(false);
      // loadAccounts will refresh from server; we already updated local state above
      onAccountCreated?.();
    } catch (error: any) {
      console.error('Error creating account:', error);
      alert(error?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete the account for ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      // Create admin client with service role key
      const adminClient = createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        serviceRoleKey || (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string),
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      // Delete from profiles table first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Delete from auth using service role
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting auth user:', authError);
        alert('Failed to delete user from authentication system');
        return;
      }

      alert('User deleted successfully');
      await loadAccounts();
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateFormData(prev => ({ ...prev, password }));
  };

  const beginEditUser = (user: User) => {
    const role = getDisplayRole(user);
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role,
      year: user.year || '68',
    });
    setNewPassword('');
  };

  const saveEditedUser = async () => {
    if (!editingUser) return;

    const key = serviceRoleKey || (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined);
    if (!key) {
      setShowServiceRoleInput(true);
      alert('Account update is not configured. Please enter your Supabase service role key.');
      return;
    }

    setSavingUser(true);
    try {
      const adminClient = createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        key,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const semanticRole = editForm.role;
      const dbRole = normalizeProfileRole(semanticRole);
      const yearValue = semanticRole === 'student' ? editForm.year : null;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          email: editForm.email,
          role: dbRole,
          year: yearValue,
        })
        .eq('id', editingUser.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        alert('Failed to update profile info');
        setSavingUser(false);
        return;
      }

      // Update auth user via admin API
      const attributes: any = {
        email: editForm.email,
        user_metadata: {
          name: editForm.name,
          role: semanticRole,
          year: yearValue,
        },
      };
      if (newPassword) {
        attributes.password = newPassword;
      }

      const { error: authError } = await adminClient.auth.admin.updateUserById(
        editingUser.id,
        attributes
      );

      if (authError) {
        console.error('Error updating auth user:', authError);
        alert('Profile updated, but failed to update authentication details');
      } else {
        alert('Account updated successfully');
      }

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === editingUser.id
            ? {
                ...u,
                name: editForm.name,
                email: editForm.email,
                role: dbRole as any,
                year: (yearValue as any) || '',
              }
            : u
        )
      );
      setEditingUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error?.message || 'Failed to save user changes');
    } finally {
      setSavingUser(false);
    }
  };

  const saveServiceRoleKey = () => {
    try {
      localStorage.setItem('supabase_service_role_key', serviceRoleKey);
    } catch {
      // ignore if storage not available
    }
    setShowServiceRoleInput(false);
    alert('Service role key saved. You can now create and delete accounts.');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-muted-foreground">
            Create and manage user accounts for DDCT Showcase
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowServiceRoleInput(true)}
            variant="outline"
            disabled={loading}
          >
            <Shield className="mr-2 h-4 w-4" />
            Configure Service Key
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Account
          </Button>
        </div>
      </div>

      {showServiceRoleInput && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Supabase Service Role Key</CardTitle>
            <p className="text-sm text-orange-700">
              Paste your Supabase <code>service_role</code> key here. It is stored only in this browser
              and used for admin actions like creating and deleting accounts.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Role Key</label>
                <Input
                  type="password"
                  value={serviceRoleKey}
                  onChange={(e) => setServiceRoleKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveServiceRoleKey} disabled={!serviceRoleKey}>
                  Save Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowServiceRoleInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="partner">Partners</option>
                <option value="admin">Admins</option>
              </select>
              <Button 
                onClick={loadAccounts}
                variant="outline"
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Account Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Account</CardTitle>
            <p className="text-sm text-muted-foreground">
              Admins can create accounts directly from this form.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <Input
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@ddct.edu.th"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    disabled={loading}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateRandomPassword}
                    disabled={loading}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              
              {createFormData.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Year</label>
                  <select
                    value={createFormData.year}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    disabled={loading}
                  >
                    <option value="68">68</option>
                    <option value="67">67</option>
                    <option value="66">66</option>
                    <option value="65">65</option>
                    <option value="64">64</option>
                    <option value="63">63</option>
                  </select>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Role *</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="student">Student</option>
                  <option value="partner">Partner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={createAccountWithServiceRole}
                disabled={loading || !createFormData.name || !createFormData.email || !createFormData.password}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {loading && !showCreateForm ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading accounts...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        <img
                          src={user.avatar || '/placeholder-avatar.svg'}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder-avatar.svg'; }}
                        />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getDisplayRole(user) === 'admin' ? 'default' : 'secondary'}>
                            {getDisplayRole(user) === 'student'
                              ? `${user.year} student`
                              : getDisplayRole(user)}
                          </Badge>
                          <Badge variant="outline">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/users/${user.id}`)}
                        disabled={loading}
                        className="text-primary"
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => beginEditUser(user)}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id, user.email)}
                        className="text-destructive hover:text-destructive"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-muted-foreground">
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>

              {editingUser && editingUser.id === user.id && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Account</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Update basic information, role, and optionally set a new password without the current password.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name</label>
                        <Input
                          value={editForm.name}
                          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          disabled={savingUser}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          disabled={savingUser}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Role</label>
                        <select
                          value={editForm.role}
                          onChange={e =>
                            setEditForm(prev => ({ ...prev, role: e.target.value as any }))
                          }
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          disabled={savingUser}
                        >
                          <option value="student">Student</option>
                          <option value="partner">Partner</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      {editForm.role === 'student' && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Year</label>
                          <select
                            value={editForm.year}
                            onChange={e => setEditForm(prev => ({ ...prev, year: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            disabled={savingUser}
                          >
                            <option value="68">68</option>
                            <option value="67">67</option>
                            <option value="66">66</option>
                            <option value="65">65</option>
                            <option value="64">64</option>
                            <option value="63">63</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-2">New Password (optional)</label>
                        <Input
                          type="text"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Set a new password"
                          disabled={savingUser}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveEditedUser} disabled={savingUser}>
                        {savingUser ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingUser(null);
                          setNewPassword('');
                        }}
                        disabled={savingUser}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterRole !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first user account to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
