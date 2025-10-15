import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Enable CORS and logging
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', logger(console.log));

// Initialize Supabase client with service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to verify user authentication
async function getAuthenticatedUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    
    // Get user profile from KV store
    const userProfile = await kv.get(`user:${user.id}`);
    return userProfile || { id: user.id, email: user.email };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Mock data initialization
const initializeMockData = async () => {
  try {
    // Check if data already exists
    const existingProjects = await kv.get('projects:list');
    if (existingProjects) return;

    // Mock users
    const mockUsers = [
      {
        id: '1',
        name: 'Alex Chen',
        email: 'alex.chen@ddct.edu',
        avatar: '/placeholder-avatar.svg',
        year: '65',
        role: 'student',
        bio: 'Passionate game developer and 3D artist with a focus on character design and interactive storytelling.',
        skills: ['Unity', 'C#', 'Blender', '3D Modeling', 'Game Design'],
        github: 'https://github.com/alexchen',
        linkedin: 'https://linkedin.com/in/alexchen',
        portfolio: 'https://alexchen.dev',
        location: 'Bangkok, Thailand',
        joinDate: 'September 2022'
      },
      {
        id: '2',
        name: 'Sarah Williams',
        email: 'sarah.williams@ddct.edu',
        avatar: '/placeholder-avatar.svg',
        year: '65',
        role: 'student',
        bio: 'Animation specialist and digital artist creating compelling visual narratives.',
        skills: ['After Effects', 'Maya', 'Character Animation', 'Motion Graphics'],
        joinDate: 'September 2021'
      },
      {
        id: '3',
        name: 'Dr. Michael Thompson',
        email: 'michael.thompson@ddct.edu',
        avatar: '/placeholder-avatar.svg',
        year: 'Faculty',
        role: 'teacher',
        bio: 'Professor of Digital Design with 15 years of industry experience.',
        skills: ['Design Theory', 'Project Management', 'Industry Mentoring']
      },
      {
        id: '4',
        name: 'Admin User',
        email: 'admin@ddct.edu',
        avatar: '/placeholder-avatar.svg',
        year: 'Staff',
        role: 'admin',
        bio: 'Platform administrator managing the DDCT Showcase system.'
      },
      {
        id: '5',
        name: 'Maya Patel',
        email: 'maya.patel@ddct.edu',
        avatar: '/placeholder-avatar.svg',
        year: '66',
        role: 'student',
        bio: 'VR/AR developer and simulation specialist.',
        skills: ['Unity', 'Unreal Engine', 'VR Development', 'AR', 'Simulation']
      }
    ];

    // Mock projects
    const mockProjects = [
      {
        id: '1',
        title: 'Cyber Odyssey: Neon Dreams',
        description: 'A cyberpunk-themed action RPG with stunning visual effects and immersive gameplay mechanics.',
        longDescription: 'Cyber Odyssey is a third-person action RPG set in a dystopian cyberpunk future. Players navigate through neon-lit cityscapes, engaging in combat with augmented enemies while uncovering a conspiracy that threatens the digital realm.',
        category: 'Games',
        thumbnail: '/placeholder-project.svg',
        author: mockUsers[0],
        stats: { views: 1250, downloads: 89, likes: 142 },
        tags: ['Unity', 'C#', '3D', 'RPG', 'Cyberpunk', 'Indie'],
        featured: true,
        publishedDate: 'October 15, 2024',
        tools: ['Unity', 'Blender', 'Photoshop', 'Substance Painter'],
        technologies: ['C#', '3D Modeling', 'Shader Programming', 'AI'],
        timeline: '12 weeks (August - October 2024)',
        links: {
          github: 'https://github.com/alexchen/cyber-odyssey',
          external: 'https://play.cyber-odyssey.com'
        }
      },
      {
        id: '2',
        title: 'Character Animation Reel 2024',
        description: 'A comprehensive showcase of character animation techniques including walk cycles, facial expressions, and action sequences.',
        category: 'Animations',
        thumbnail: '/placeholder-project.svg',
        author: mockUsers[1],
        stats: { views: 890, downloads: 45, likes: 67 },
        tags: ['Maya', 'Animation', 'Character', 'Rigging', 'Motion'],
        featured: true,
        tools: ['Maya', 'After Effects', 'Premiere Pro'],
        technologies: ['3D Animation', 'Rigging', 'Motion Capture'],
        collaborators: [
          { id: '6', name: 'John Doe', role: 'Voice Actor', avatar: '' }
        ]
      },
      {
        id: '3',
        title: 'Digital Portrait Series',
        description: 'A collection of hyper-realistic digital portraits exploring emotions and human expressions.',
        category: 'Digital Art',
        thumbnail: '/placeholder-project.svg',
        author: mockUsers[1],
        stats: { views: 756, downloads: 234, likes: 189 },
        tags: ['Digital Art', 'Portraits', 'Photoshop', 'Concept Art'],
        featured: false,
        tools: ['Photoshop', 'Procreate', 'Wacom Tablet']
      },
      {
        id: '4',
        title: 'VR Physics Simulation Lab',
        description: 'An educational VR application for visualizing complex physics concepts in an interactive 3D environment.',
        category: 'Simulations',
        thumbnail: '/placeholder-project.svg',
        author: mockUsers[4],
        stats: { views: 432, downloads: 67, likes: 89 },
        tags: ['VR', 'Physics', 'Education', 'Unity', 'Simulation'],
        featured: true,
        tools: ['Unity', 'Oculus SDK', 'C#'],
        technologies: ['VR Development', 'Physics Simulation', 'Educational Technology']
      },
      {
        id: '5',
        title: 'Mobile Game Prototype',
        description: 'A puzzle-platformer mobile game with innovative mechanics and charming art style.',
        category: 'Games',
        thumbnail: '/placeholder-project.svg',
        author: mockUsers[0],
        stats: { views: 623, downloads: 123, likes: 94 },
        tags: ['Mobile', 'Puzzle', 'Platformer', 'Unity', '2D'],
        featured: false
      },
      {
        id: '6',
        title: '3D Environment Art',
        description: 'Detailed 3D environments showcasing advanced modeling and texturing techniques.',
        category: 'Digital Art',
        thumbnail: '/placeholder-project.svg',
        author: mockUsers[4],
        stats: { views: 445, downloads: 56, likes: 72 },
        tags: ['3D', 'Environment', 'Blender', 'Texturing'],
        featured: false
      }
    ];

    // Store mock data
    await kv.set('users:list', mockUsers);
    await kv.set('projects:list', mockProjects);

    // Store individual users and projects for easy lookup
    for (const user of mockUsers) {
      await kv.set(`user:${user.id}`, user);
    }
    
    for (const project of mockProjects) {
      await kv.set(`project:${project.id}`, project);
    }

    console.log('Mock data initialized successfully');
  } catch (error) {
    console.error('Error initializing mock data:', error);
  }
};

// Initialize demo users and mock data
const initializeDemoUsers = async () => {
  try {
    console.log('Initializing demo users...');
    
    // Check if demo users are already initialized
    const demoInitialized = await kv.get('demo_users_initialized');
    if (demoInitialized) {
      console.log('Demo users already initialized');
      return;
    }

    // Create demo users for testing
    const demoUsers = [
      { email: 'student@ddct.edu', password: 'demo123', name: 'Alex Chen', year: '68', role: 'student' },
      { email: 'teacher@ddct.edu', password: 'demo123', name: 'Dr. Michael Thompson', year: 'Faculty', role: 'teacher' },
      { email: 'admin@ddct.edu', password: 'demo123', name: 'Admin User', year: 'Staff', role: 'admin' }
    ];

    const createdUsers = [];

    for (const user of demoUsers) {
      try {
        console.log(`Creating demo user: ${user.email}`);
        
        // Try to create user directly
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          user_metadata: { name: user.name, year: user.year, role: user.role },
          email_confirm: true
        });

        if (error) {
          console.log(`Error creating user ${user.email}:`, error.message);
          // If user already exists, try to get them
          if (error.message.includes('already registered')) {
            const { data: existingUser } = await supabase.auth.admin.getUserByEmail(user.email);
            if (existingUser.user) {
              console.log(`User ${user.email} already exists, updating profile`);
              // Create/update user profile
              const userProfile = {
                id: existingUser.user.id,
                name: user.name,
                email: user.email,
                year: user.year,
                role: user.role,
                avatar: '',
                bio: `Demo ${user.role} account for DDCT Showcase`,
                skills: user.role === 'student' ? ['Unity', 'C#', 'Game Design'] : [],
                joinDate: 'October 2024'
              };
              await kv.set(`user:${existingUser.user.id}`, userProfile);
              createdUsers.push(userProfile);
            }
          }
        } else if (data.user) {
          console.log(`Successfully created user: ${user.email}`);
          // Create user profile
          const userProfile = {
            id: data.user.id,
            name: user.name,
            email: user.email,
            year: user.year,
            role: user.role,
            avatar: '',
            bio: `Demo ${user.role} account for DDCT Showcase`,
            skills: user.role === 'student' ? ['Unity', 'C#', 'Game Design'] : [],
            joinDate: 'October 2024'
          };

          await kv.set(`user:${data.user.id}`, userProfile);
          createdUsers.push(userProfile);
        }
      } catch (error) {
        console.error(`Failed to create demo user ${user.email}:`, error);
      }
    }

    // Mark demo users as initialized
    await kv.set('demo_users_initialized', true);
    await kv.set('demo_users_list', createdUsers);
    
    console.log('Demo user initialization completed');
  } catch (error) {
    console.error('Error initializing demo users:', error);
  }
};

// Initialize demo users and mock data on server start
await initializeDemoUsers();
await initializeMockData();

// Routes

// Health check
app.get('/make-server-7d410c83/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Status check for debugging
app.get('/make-server-7d410c83/status', async (c) => {
  try {
    const demoInitialized = await kv.get('demo_users_initialized');
    const projectsCount = (await kv.get('projects:list') || []).length;
    const usersCount = (await kv.get('users:list') || []).length;
    
    return c.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      demo_users_initialized: !!demoInitialized,
      projects_count: projectsCount,
      users_count: usersCount,
      supabase_url: !!Deno.env.get('SUPABASE_URL'),
      service_role_key: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    });
  } catch (error) {
    return c.json({ 
      status: 'error', 
      error: (error as Error).message,
      timestamp: new Date().toISOString() 
    }, 500);
  }
});

// Demo authentication route for testing
app.post('/make-server-7d410c83/auth/demo-login', async (c) => {
  try {
    const { role } = await c.req.json();
    
    // Get demo users from KV store
    const demoUsers = await kv.get('demo_users_list') || [];
    const demoUser = demoUsers.find((u: any) => u.role === role);
    
    if (demoUser) {
      return c.json({ user: demoUser, success: true });
    } else {
      // Fallback to mock data
      const mockUsers = await kv.get('users:list') || [];
      const mockUser = mockUsers.find((u: any) => u.role === role) || mockUsers[0];
      return c.json({ user: mockUser, success: true });
    }
  } catch (error) {
    console.error('Demo login error:', error);
    return c.json({ error: 'Demo login failed' }, 500);
  }
});

// Authentication routes
app.post('/make-server-7d410c83/auth/signup', async (c) => {
  try {
    const { email, password, name, year, role = 'student' } = await c.req.json();

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, year, role },
      email_confirm: true // Auto-confirm since email server not configured
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile
    const userProfile = {
      id: data.user.id,
      name,
      email,
      year,
      role,
      avatar: '',
      bio: '',
      skills: [],
      joinDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
    };

    await kv.set(`user:${data.user.id}`, userProfile);

    // Update users list
    const users = await kv.get('users:list') || [];
    users.push(userProfile);
    await kv.set('users:list', users);

    return c.json({ 
      user: userProfile,
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('Signup process error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

app.get('/make-server-7d410c83/auth/profile', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return c.json(user);
});

// Projects routes
app.get('/make-server-7d410c83/projects', async (c) => {
  try {
    const projects = await kv.get('projects:list') || [];
    return c.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

app.get('/make-server-7d410c83/projects/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const project = await kv.get(`project:${projectId}`);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Increment view count
    project.stats.views += 1;
    await kv.set(`project:${projectId}`, project);

    // Update in projects list
    const projects = await kv.get('projects:list') || [];
    const updatedProjects = projects.map((p: any) => 
      p.id === projectId ? project : p
    );
    await kv.set('projects:list', updatedProjects);

    return c.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

app.post('/make-server-7d410c83/projects', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const projectData = await c.req.json();
    const projectId = crypto.randomUUID();
    
    const project = {
      id: projectId,
      ...projectData,
      author: user,
      stats: { views: 0, downloads: 0, likes: 0 },
      publishedDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      featured: false
    };

    await kv.set(`project:${projectId}`, project);

    // Update projects list
    const projects = await kv.get('projects:list') || [];
    projects.push(project);
    await kv.set('projects:list', projects);

    return c.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Users routes
app.get('/make-server-7d410c83/users', async (c) => {
  try {
    const users = await kv.get('users:list') || [];
    return c.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.get('/make-server-7d410c83/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Admin routes
app.get('/make-server-7d410c83/admin/analytics', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const projects = await kv.get('projects:list') || [];
    const users = await kv.get('users:list') || [];

    const analytics = {
      totalProjects: projects.length,
      totalUsers: users.filter((u: any) => u.role === 'student').length,
      featuredProjects: projects.filter((p: any) => p.featured).length,
      totalViews: projects.reduce((sum: number, p: any) => sum + p.stats.views, 0),
      projectsByCategory: {
        Games: projects.filter((p: any) => p.category === 'Games').length,
        Animations: projects.filter((p: any) => p.category === 'Animations').length,
        'Digital Art': projects.filter((p: any) => p.category === 'Digital Art').length,
        Simulations: projects.filter((p: any) => p.category === 'Simulations').length,
        Others: projects.filter((p: any) => p.category === 'Others').length
      },
      projectsByYear: {
        '69': projects.filter((p: any) => p.author.year === '69').length,
        '68': projects.filter((p: any) => p.author.year === '68').length,
        '67': projects.filter((p: any) => p.author.year === '67').length,
        '66': projects.filter((p: any) => p.author.year === '66').length,
        '65': projects.filter((p: any) => p.author.year === '65').length
      }
    };

    return c.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Export PDF resume for teachers
app.get('/make-server-7d410c83/admin/export-resume/:userId', async (c) => {
  const user = await getAuthenticatedUser(c.req.header('Authorization'));
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userId = c.req.param('id');
    const targetUser = await kv.get(`user:${userId}`);
    
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    const projects = await kv.get('projects:list') || [];
    const userProjects = projects.filter((p: any) => p.author.id === userId);

    // Generate PDF resume summary (mock implementation)
    const resumeData = {
      user: targetUser,
      projects: userProjects,
      summary: {
        totalProjects: userProjects.length,
        featuredProjects: userProjects.filter((p: any) => p.featured).length,
        categories: [...new Set(userProjects.map((p: any) => p.category))],
        totalViews: userProjects.reduce((sum: number, p: any) => sum + p.stats.views, 0)
      },
      exportDate: new Date().toISOString()
    };

    return c.json({ 
      message: 'Resume export prepared',
      data: resumeData,
      downloadUrl: '#' // In real implementation, this would be a PDF file URL
    });
  } catch (error) {
    console.error('Error exporting resume:', error);
    return c.json({ error: 'Failed to export resume' }, 500);
  }
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Start server
Deno.serve(app.fetch);