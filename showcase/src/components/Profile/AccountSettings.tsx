import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge-simple';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  User,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';

interface AccountSettingsProps {
  user: any;
  onClose?: () => void;
}

// Initialize Supabase client
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export function AccountSettings({ user, onClose }: AccountSettingsProps) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [yearUpdateLoading, setYearUpdateLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(user.year || '68');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword
      });

      if (verifyError) {
        setMessage({ type: 'error', text: 'Current password is incorrect' });
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Auto-close after success
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Password update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update password. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleYearUpdate = async () => {
    if (selectedYear === user.year) {
      setMessage({ type: 'error', text: 'Please select a different year to update' });
      return;
    }

    setYearUpdateLoading(true);
    setMessage(null);

    try {
      // Update year in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ year: selectedYear })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Year updated successfully!' });
      
      // Update local user object
      user.year = selectedYear;

      // Auto-close after success
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Year update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update year. Please try again.' 
      });
    } finally {
      setYearUpdateLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'partner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and preferences
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Account Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
                ) : (
                  <img src="/placeholder-avatar.svg" alt={user.name} className="w-16 h-16 rounded-full" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.year} {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Update for Students */}
      {user.role === 'student' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Update Student Year
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Change your student year code
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Year: <span className="font-semibold">{user.year}</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-background"
                  disabled={yearUpdateLoading}
                >
                  <option value="68">68</option>
                  <option value="67">67</option>
                  <option value="66">66</option>
                  <option value="65">65</option>
                  <option value="64">64</option>
                  <option value="63">63</option>
                  <option value="62">62</option>
                  <option value="61">61</option>
                </select>
              </div>

              <Button 
                onClick={handleYearUpdate}
                disabled={yearUpdateLoading || selectedYear === user.year}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {yearUpdateLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating Year...
                  </div>
                ) : (
                  'Update Year'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your password to keep your account secure
          </p>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password *
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ 
                    ...prev, 
                    currentPassword: e.target.value 
                  }))}
                  placeholder="Enter your current password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                New Password *
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ 
                    ...prev, 
                    newPassword: e.target.value 
                  }))}
                  placeholder="Enter your new password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ 
                    ...prev, 
                    confirmPassword: e.target.value 
                  }))}
                  placeholder="Confirm your new password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordForm.newPassword && passwordForm.confirmPassword && (
                <p className={`text-xs mt-1 ${
                  passwordForm.newPassword === passwordForm.confirmPassword 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword 
                    ? '✓ Passwords match' 
                    : '✗ Passwords do not match'
                  }
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating Password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}