-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT post_has_content CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Create function to sync auth.users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (remove @miaoda.com)
  extracted_username := REPLACE(NEW.email, '@miaoda.com', '');
  
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    extracted_username,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger to sync users
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- RLS Policies for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- RLS Policies for likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create likes" ON public.likes
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- RLS Policies for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- Create function to update post counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for count updates
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-9be0q97dakn5_post_images', 'app-9be0q97dakn5_post_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post images
CREATE POLICY "Anyone can view post images" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-9be0q97dakn5_post_images');

CREATE POLICY "Authenticated users can upload post images" ON storage.objects
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'app-9be0q97dakn5_post_images');

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'app-9be0q97dakn5_post_images');

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE TO authenticated 
  USING (bucket_id = 'app-9be0q97dakn5_post_images');