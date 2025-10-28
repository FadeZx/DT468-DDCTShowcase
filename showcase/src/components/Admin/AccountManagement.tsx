import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge-simple';
import supabase from '../../utils/supabase/client';
import { createClient } from '@supabase/supabase-js';
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

// Use app-wide Supabase client instance for regular operations

export function AccountManagement({ onAccountCreated }: AccountManagementProps) {
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

  useEffect(() => {
    loadAccounts();
    // Check if service role key is stored
    const storedKey = localStorage.getItem('supabase_service_role_key');
    if (storedKey) {
      setServiceRoleKey(storedKey);
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
      filtered = filtered.filter(user => user.role === filterRole);
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
    if (!serviceRoleKey) {
      setShowServiceRoleInput(true);
      return;
    }

    setLoading(true);
    try {
      // Create admin client with service role key
      const adminClient = createClient(
        `https://${projectId}.supabase.co`,
        serviceRoleKey,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      // Create user in Supabase Auth
      const { data, error } = await adminClient.auth.admin.createUser({
        email: createFormData.email,
        password: createFormData.password,
        user_metadata: {
          name: createFormData.name,
          role: createFormData.role,
          year: createFormData.year
        },
        email_confirm: true // Auto-confirm email for admin-created accounts
      });

      if (error) throw error;

      // Create profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: createFormData.email,
          name: createFormData.name,
          role: createFormData.role,
          year: createFormData.year,
          bio: `${createFormData.role.charAt(0).toUpperCase() + createFormData.role.slice(1)} at DDCT`,
          skills: []
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here as the auth user was created successfully
      }

      alert(`Account created successfully!\nEmail: ${createFormData.email}\nPassword: ${createFormData.password}\n\nPlease save these credentials and share them with the user.`);
      
      // Reset form
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        year: '68',
        role: 'student'
      });
      setShowCreateForm(false);
      
      // Refresh accounts list
      await loadAccounts();
      
      // Call callback if provided
      if (onAccountCreated) {
        onAccountCreated();
      }
      
    } catch (error: any) {
      console.error('Error creating account:', error);
      if (error.message.includes('Invalid API key')) {
        alert('Invalid service role key. Please check your key and try again.');
        setShowServiceRoleInput(true);
      } else {
        alert(error.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveServiceRoleKey = () => {
    localStorage.setItem('supabase_service_role_key', serviceRoleKey);
    setShowServiceRoleInput(false);
    alert('Service role key saved! You can now create accounts directly.');
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete the account for ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    if (!serviceRoleKey) {
      alert('Service role key required for user deletion. Please set it first.');
      setShowServiceRoleInput(true);
      return;
    }

    try {
      setLoading(true);

      // Create admin client with service role key
      const adminClient = createClient(
        `https://${projectId}.supabase.co`,
        serviceRoleKey,
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
          {!serviceRoleKey && (
            <Button 
              onClick={() => setShowServiceRoleInput(true)}
              variant="outline"
              className="mr-2"
            >
              <Shield className="mr-2 h-4 w-4" />
              Setup Service Key
            </Button>
          )}
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

      {/* Service Role Key Input */}
      {showServiceRoleInput && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Setup Service Role Key</CardTitle>
            <p className="text-sm text-orange-700">
              To create accounts directly in the app, you need to provide your Supabase service role key.
              This key will be stored locally in your browser.
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
                <p className="text-xs text-muted-foreground mt-1">
                  Find this in your Supabase Dashboard → Settings → API → service_role key
                </p>
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
              {serviceRoleKey 
                ? "Create accounts directly in the application."
                : "You need to setup the service role key first to create accounts directly."
              }
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
                  <option value="Staff">Staff</option>
                </select>
              </div>
              
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
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <img src="/placeholder-avatar.svg" alt={user.name} className="w-12 h-12 rounded-full" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.year} {user.role}
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