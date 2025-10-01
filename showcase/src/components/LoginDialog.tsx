import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, GraduationCap, Shield } from 'lucide-react';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onDemoLogin: (role: 'student' | 'teacher' | 'admin') => void;
}

export function LoginDialog({ isOpen, onClose, onLogin, onDemoLogin }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onLogin(email, password);
      onClose();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'teacher' | 'admin') => {
    setDemoLoading(role);
    try {
      await onDemoLogin(role);
      onClose();
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setDemoLoading(null);
    }
  };

  const demoAccounts = [
    {
      role: 'student' as const,
      email: 'student@ddct.edu',
      password: 'demo123',
      icon: User,
      title: 'Student Account',
      description: 'Access student features: create projects, collaborate, showcase work'
    },
    {
      role: 'teacher' as const,
      email: 'teacher@ddct.edu',
      password: 'demo123',
      icon: GraduationCap,
      title: 'Teacher Account',
      description: 'Access teacher features: review portfolios, export student resumes'
    },
    {
      role: 'admin' as const,
      email: 'admin@ddct.edu',
      password: 'demo123',
      icon: Shield,
      title: 'Admin Account',
      description: 'Access admin features: manage platform, view analytics, moderate content'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to DDCT Showcase</DialogTitle>
          <DialogDescription>
            Choose a demo account to explore different user roles, or sign in with your own credentials.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demo">Demo Accounts</TabsTrigger>
            <TabsTrigger value="login">Custom Login</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Demo Mode:</strong> Try different user roles to explore all features. 
                Authentication is handled locally for demonstration purposes.
              </p>
            </div>
            
            <div className="space-y-3">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <Card 
                    key={account.role}
                    className={`cursor-pointer hover:bg-accent transition-colors ${
                      demoLoading === account.role ? 'opacity-75' : ''
                    }`}
                    onClick={() => handleDemoLogin(account.role)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {demoLoading === account.role ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 text-primary" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {demoLoading === account.role ? 'Signing in...' : account.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {account.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@ddct.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-sm text-muted-foreground text-center mb-2">
                <strong>Demo Credentials:</strong>
              </p>
              <div className="space-y-1">
                {demoAccounts.map((account) => (
                  <p key={account.role} className="text-xs text-center">
                    <strong>{account.title}:</strong> {account.email} / {account.password}
                  </p>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Note: Authentication may fall back to demo mode automatically
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}