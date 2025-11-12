-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.project_comments(id),
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profile_avatars (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  public_url text NOT NULL,
  content_type text,
  file_size bigint,
  is_current boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_avatars_pkey PRIMARY KEY (id),
  CONSTRAINT profile_avatars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text UNIQUE,
  name text,
  role text DEFAULT 'guest'::text CHECK (role = ANY (ARRAY['admin'::text, 'student'::text, 'guest'::text])),
  year text,
  avatar text,
  bio text,
  skills jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  location text,
  majors text,
  github text,
  linkedin text,
  portfolio text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.project_collaborators (
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'collaborator'::text,
  invited_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  job_role text,
  CONSTRAINT project_collaborators_pkey PRIMARY KEY (project_id, user_id),
  CONSTRAINT project_collaborators_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT project_collaborators_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.project_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  user_id uuid,
  parent_id uuid,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_comments_pkey PRIMARY KEY (id),
  CONSTRAINT project_comments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT project_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.project_comments(id)
);
CREATE TABLE public.project_files (
  id uuid NOT NULL,
  project_id uuid,
  file_name text,
  file_url text,
  file_path text,
  file_type text,
  file_size bigint,
  mime_type text,
  is_cover boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_files_pkey PRIMARY KEY (id),
  CONSTRAINT project_files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_likes_pkey PRIMARY KEY (id),
  CONSTRAINT project_likes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL,
  title text NOT NULL,
  description text,
  long_description text,
  category text,
  author_id uuid,
  tags ARRAY DEFAULT ARRAY[]::text[],
  price numeric DEFAULT 0,
  cover_image text,
  created_at timestamp with time zone DEFAULT now(),
  description_html text,
  owner_id uuid NOT NULL,
  slug text,
  visibility text NOT NULL DEFAULT 'draft'::text CHECK (visibility = ANY (ARRAY['draft'::text, 'private'::text, 'unlisted'::text, 'public'::text])),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT projects_owner_fk FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);