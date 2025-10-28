import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Shield, GraduationCap, User } from 'lucide-react';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignedIn: (profile: any) => void;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  quickLoginEmails: { admin: string; student: string };
}

export function AuthDialog({ isOpen, onClose, onSignedIn, signInWithEmail, quickLoginEmails }: AuthDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const profile = await signInWithEmail(email, password);
      onSignedIn(profile);
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: 'admin' | 'student') => {
    setLoading(true);
    setError('');
    try {
      // Default seed passwords we will create with the seed script
      const pwd = role === 'admin' ? 'Admin#468' : 'Student#468';
      const emailToUse = role === 'admin' ? quickLoginEmails.admin : quickLoginEmails.student;
      const profile = await signInWithEmail(emailToUse, pwd);
      onSignedIn(profile);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sign in to DDCT Showcase</DialogTitle>
          <DialogDescription>
            Use Quick Login for pre-created roles or Email & Password.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quick">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="quick">Quick Login</TabsTrigger>
            <TabsTrigger value="email">Email & Password</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={() => handleQuick('admin')} disabled={loading} className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> Admin
              </Button>
              <Button onClick={() => handleQuick('student')} disabled={loading} className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Student
              </Button>
              <Button variant="outline" onClick={onClose} disabled={loading} className="flex items-center gap-2">
                <User className="w-4 h-4" /> Continue as Guest
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Note: Quick Login uses pre-seeded accounts. Guest browsing does not sign you in.
            </p>
          </TabsContent>

          <TabsContent value="email">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your.email@ddct.edu.th" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="bg-muted/50 border border-border rounded-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            No self-registration. Ask admin to create your account.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
