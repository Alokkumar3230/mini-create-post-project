export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  username: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  content?: string;
  image_url?: string;
}

export interface CreateCommentInput {
  post_id: string;
  content: string;
}
