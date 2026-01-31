import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi, commentsApi } from '@/db/api';
import type { Post, Comment } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import PostCard from '@/components/PostCard';
import CommentSection from '@/components/CommentSection';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadPost = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const postData = await postsApi.getPost(id);
      if (!postData) {
        toast({
          title: 'Error',
          description: 'Post not found',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      setPost(postData);

      const commentsData = await commentsApi.getComments(id);
      setComments(commentsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  const handleCommentAdded = (comment: Comment) => {
    setComments([...comments, comment]);
    if (post) {
      setPost({ ...post, comments_count: post.comments_count + 1 });
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
    if (post) {
      setPost({ ...post, comments_count: post.comments_count - 1 });
    }
  };

  const handlePostDeleted = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <Skeleton className="h-10 w-32 bg-muted" />
          <div className="space-y-3 p-6 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-muted" />
              <Skeleton className="h-4 w-32 bg-muted" />
            </div>
            <Skeleton className="h-32 w-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Button>

        <PostCard post={post} onDeleted={handlePostDeleted} showFullContent />

        <CommentSection
          postId={post.id}
          comments={comments}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      </div>
    </div>
  );
}
