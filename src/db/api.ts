import { supabase } from './supabase';
import type { Post, Comment, CreatePostInput, CreateCommentInput, Profile } from '@/types/index';

// Posts API
export const postsApi = {
  // Get all posts with pagination
  async getPosts(page = 1, limit = 10): Promise<{ data: Post[]; count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], count: count || 0 };
  },

  // Get single post by ID
  async getPost(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Create new post
  async createPost(userId: string, username: string, input: CreatePostInput): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        username,
        content: input.content || null,
        image_url: input.image_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete post
  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Likes API
export const likesApi = {
  // Check if user liked a post
  async checkLike(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // Toggle like on a post
  async toggleLike(postId: string, userId: string, username: string): Promise<boolean> {
    const isLiked = await this.checkLike(postId, userId);

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;
      return false;
    }

    const { error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: userId,
        username,
      });

    if (error) throw error;
    return true;
  },
};

// Comments API
export const commentsApi = {
  // Get comments for a post
  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  // Create comment
  async createComment(userId: string, username: string, input: CreateCommentInput): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: input.post_id,
        user_id: userId,
        username,
        content: input.content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete comment
  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Profiles API
export const profilesApi = {
  // Get profile by ID
  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get profile by username
  async getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

// Storage API
export const storageApi = {
  // Upload image
  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('app-9be0q97dakn5_post_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('app-9be0q97dakn5_post_images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
