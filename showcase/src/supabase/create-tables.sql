-- Create tables for the project showcase application

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  long_description TEXT,
  category VARCHAR(100),
  cover_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tags TEXT[], -- Array of tags
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  github_url TEXT,
  demo_url TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50), -- image, document, video, etc.
  file_size BIGINT,
  mime_type VARCHAR(100),
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_collaborators table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'collaborator', -- owner, collaborator, viewer
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_author_id ON projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_file_type ON project_files(file_type);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects table
DROP POLICY IF EXISTS "Users can view published projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

CREATE POLICY "Users can view published projects" ON projects
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for project_files table
DROP POLICY IF EXISTS "Users can view project files" ON project_files;
DROP POLICY IF EXISTS "Users can create project files" ON project_files;
DROP POLICY IF EXISTS "Users can update their project files" ON project_files;
DROP POLICY IF EXISTS "Users can delete their project files" ON project_files;

CREATE POLICY "Users can view project files" ON project_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND (projects.status = 'published' OR projects.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can create project files" ON project_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their project files" ON project_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their project files" ON project_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.author_id = auth.uid()
    )
  );

-- Create RLS policies for project_collaborators table
DROP POLICY IF EXISTS "Users can view project collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Users can manage project collaborators" ON project_collaborators;

CREATE POLICY "Users can view project collaborators" ON project_collaborators
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage project collaborators" ON project_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.author_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();