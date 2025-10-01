import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { LoginDialog } from './LoginDialog';
import { Search, User, Settings, LogOut, BarChart3 } from 'lucide-react';

interface HeaderProps {
  currentUser: any;
  onLogin: (email: string, password: string) => Promise<void>;
  onDemoLogin: (role: 'student' | 'teacher' | 'admin') => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export function Header({ currentUser, onLogin, onDemoLogin, onLogout, onNavigate }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <img 
              src="/DDCTlogo.png" 
              alt="DDCT Logo" 
              className="h-8 w-auto"
            />
            <div className="text-xl font-semibold">Showcase</div>
          </div>
          
          <nav className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('home')}
              className="hover:text-orange-500 transition-colors duration-200"
            >
              Discover
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('browse')}
              className="hover:text-orange-500 transition-colors duration-200"
            >
              Browse
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('events')}
              className="hover:text-orange-500 transition-colors duration-200"
            >
              Events
            </Button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects, students, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onNavigate('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                {currentUser.role === 'admin' && (
                  <DropdownMenuItem onClick={() => onNavigate('admin')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => setShowLoginDialog(true)} 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLogin={onLogin}
        onDemoLogin={onDemoLogin}
      />
    </header>
  );
}