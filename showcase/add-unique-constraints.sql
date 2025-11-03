-- Add unique constraints to prevent duplicate likes
-- Run this in your Supabase SQL Editor

-- Add unique constraint to project_likes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_likes_project_id_user_id_key'
    ) THEN
        ALTER TABLE public.project_likes 
        ADD CONSTRAINT project_likes_project_id_user_id_key 
        UNIQUE (project_id, user_id);
    END IF;
END $$;

-- Add unique constraint to comment_likes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'comment_likes_comment_id_user_id_key'
    ) THEN
        ALTER TABLE public.comment_likes 
        ADD CONSTRAINT comment_likes_comment_id_user_id_key 
        UNIQUE (comment_id, user_id);
    END IF;
END $$;