import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { User, BarChart3, GraduationCap } from 'lucide-react';

interface RoleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelected: (role: 'admin' | 'student' | 'guest') => void;
}

const mockUsers = {
  admin: {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@ddct.edu',
    role: 'admin' as const,
    avatar: null
  },
  student: {
    id: 'student-1', 
    name: 'Student User',
    email: 'student@ddct.edu',
    role: 'student' as const,
    avatar: null,
    year: '2025'
  },
  guest: {
    id: 'guest-1',
    name: 'Guest User',
    email: 'guest@example.com',
    role: 'guest' as const,
    avatar: null
  }
};

export function RoleSelector({ isOpen, onClose, onRoleSelected }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'student' | 'guest'>();

  const handleRoleSelect = (role: 'admin' | 'student' | 'guest') => {
    setSelectedRole(role);
    onRoleSelected(role);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>
            Choose a role to experience the DDCT Showcase platform
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'admin' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleRoleSelect('admin')}
          >
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Administrator</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Full access to user management, project moderation, and platform analytics
              </p>
              <Button variant="outline" className="w-full">
                Select Admin
              </Button>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'student' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleRoleSelect('student')}
          >
            <CardContent className="p-6 text-center">
              <GraduationCap className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Student</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload projects, manage your portfolio, and collaborate with other students
              </p>
              <Button variant="outline" className="w-full">
                Select Student
              </Button>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'guest' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleRoleSelect('guest')}
          >
            <CardContent className="p-6 text-center">
              <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Guest</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse projects and view content without authentication requirements
              </p>
              <Button variant="outline" className="w-full">
                Select Guest
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-3 mt-4">
          <p className="text-sm text-muted-foreground text-center">
            This is a demo mode. You can switch roles at any time by logging out and selecting a different role.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { mockUsers };