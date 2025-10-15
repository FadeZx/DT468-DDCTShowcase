import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Search, User, Settings, LogOut, BarChart3, Upload } from 'lucide-react';

interface HeaderProps {
  currentUser: any;
  onLogin: () => void;
  onLogout: () => void;
}

export function Header({ currentUser, onLogin, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <img 
              src="/DDCTlogo.png" 
              alt="DDCT Logo" 
              className="h-8 w-auto"
            />
            <div className="text-xl font-semibold">Showcase</div>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link to="/">
              <Button 
                variant="ghost" 
                className="hover:text-orange-500 transition-colors duration-200"
              >
                Events
              </Button>
            </Link>
          
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
          {currentUser?.role === 'student' && (
            <Link to="/upload">
              <Button 
                className="bg-orange-500 text-white hover:text-orange-600 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Project
              </Button>
            </Link>
          )}
          
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src="/placeholder-avatar.svg" />
                  <AvatarFallback>{currentUser.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                {currentUser.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
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
              onClick={onLogin} 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}