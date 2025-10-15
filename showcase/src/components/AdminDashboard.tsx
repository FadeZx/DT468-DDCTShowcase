import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Users, BookOpen, Award, TrendingUp, Download, 
  Calendar, Filter, FileText, Settings 
} from 'lucide-react';

interface AdminDashboardProps {
  projects: any[];
  users: any[];
}

export function AdminDashboard({ projects, users }: AdminDashboardProps) {
  const [selectedYear, setSelectedYear] = useState('2024');

  // Calculate statistics
  const totalProjects = projects.length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const featuredProjects = projects.filter(p => p.featured).length;
  const totalViews = projects.reduce((sum, p) => sum + p.stats.views, 0);

  // Projects by category data
  const categoryData = [
    { name: 'Games', count: projects.filter(p => p.category === 'Games').length, color: '#ff6b35' },
    { name: 'Animations', count: projects.filter(p => p.category === 'Animations').length, color: '#4ade80' },
    { name: 'Digital Art', count: projects.filter(p => p.category === 'Digital Art').length, color: '#60a5fa' },
    { name: 'Simulations', count: projects.filter(p => p.category === 'Simulations').length, color: '#f59e0b' },
    { name: 'Others', count: projects.filter(p => p.category === 'Others').length, color: '#ec4899' }
  ];

  // Projects by student year
  const yearData = [
    { year: '68', count: projects.filter(p => p.author.year === '68').length },
    { year: '67', count: projects.filter(p => p.author.year === '67').length },
    { year: '66', count: projects.filter(p => p.author.year === '66').length },
    { year: '65', count: projects.filter(p => p.author.year === '65').length }
  ];

  // Monthly project submissions (mock data)
  const monthlyData = [
    { month: 'Jan', projects: 12, views: 1200 },
    { month: 'Feb', projects: 15, views: 1500 },
    { month: 'Mar', projects: 18, views: 2100 },
    { month: 'Apr', projects: 22, views: 2800 },
    { month: 'May', projects: 25, views: 3200 },
    { month: 'Jun', projects: 20, views: 2900 },
    { month: 'Jul', projects: 16, views: 2200 },
    { month: 'Aug', projects: 19, views: 2600 },
    { month: 'Sep', projects: 28, views: 3800 },
    { month: 'Oct', projects: 32, views: 4200 },
    { month: 'Nov', projects: 24, views: 3500 },
    { month: 'Dec', projects: 18, views: 2800 }
  ];

  const recentProjects = projects.slice(0, 10);

  const exportReport = () => {
    console.log('Exporting analytics report...');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of DDCT Showcase platform analytics and management
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-green-500">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-green-500">+5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Featured Projects</p>
                <p className="text-2xl font-bold">{featuredProjects}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-blue-500">3</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-green-500">+18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="projects">Project Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Projects by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Projects by Student Year */}
            <Card>
              <CardHeader>
                <CardTitle>Projects by Student Year</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yearData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff6b35" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Project Submissions & Views</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="projects" 
                    stroke="#ff6b35" 
                    fill="#ff6b35" 
                    fillOpacity={0.6}
                    name="Projects"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#4ade80" 
                    fill="#4ade80" 
                    fillOpacity={0.4}
                    name="Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Projects
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <img 
                        src="/placeholder-project.svg" 
                        alt={project.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          by {project.author.name} • {project.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{project.author.year}</Badge>
                          {project.featured && (
                            <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div>{project.stats.views} views</div>
                        <div className="text-muted-foreground">{project.stats.likes} likes</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {user.name[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.email} • {user.year} • {user.role}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div>{projects.filter(p => p.author.id === user.id).length} projects</div>
                        <div className="text-muted-foreground">
                          Joined {user.joinDate || 'Sept 2024'}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Project Management</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Auto-approve student projects</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Featured project criteria</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">User Management</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Student registration approval</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Teacher role permissions</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Export & Reports</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Automated monthly reports</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Student resume templates</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}