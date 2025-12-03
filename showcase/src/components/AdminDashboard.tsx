import { Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { AnalyticsTab } from './Admin/AnalyticsTab.tsx';
import { ProjectsTab } from './Admin/ProjectsTab.tsx';
import { AccountManagement } from './Admin/AccountManagement';

interface AdminDashboardProps {
  projects: any[];
  users: any[];
}

export function AdminDashboard({ projects, users }: AdminDashboardProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor DDCT project submissions, student engagement, and platform activity.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="projects">Project Management</TabsTrigger>
          <TabsTrigger value="users">Account Management</TabsTrigger>
        </TabsList>

        <AnalyticsTab projects={projects} users={users} />
        <ProjectsTab projects={projects} />
        <TabsContent value="users" className="space-y-6">
          <AccountManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
