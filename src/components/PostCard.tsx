import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/index';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { likesApi, postsApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PostCardProps {
  post: Post;
  onDeleted?: () => void;
  showFullContent?: boolean;
}

export default function PostCard({ post, onDeleted, showFullContent = false }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!user || !profile) {
      toast({
        title: 'Login Required',
        description: 'Please login to like posts',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const isLiked = await likesApi.toggleLike(post.id, user.id, profile.username);
      setLiked(isLiked);
      setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await postsApi.deletePost(post.id);
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
      onDeleted?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const handleCardClick = () => {
    if (!showFullContent) {
      navigate(`/post/${post.id}`);
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <Card className={showFullContent ? '' : 'cursor-pointer hover:shadow-lg transition-shadow'}>
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(post.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {user?.id === post.user_id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this post? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4" onClick={handleCardClick}>
        {post.content && (
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        )}
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post content"
            className="w-full rounded-lg object-cover max-h-96"
          />
        )}
      </CardContent>
      <CardFooter className="flex gap-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          disabled={loading}
        >
          <Heart className={`h-5 w-5 ${liked ? 'fill-secondary text-secondary' : ''}`} />
          <span>{likesCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            if (!showFullContent) {
              navigate(`/post/${post.id}`);
            }
          }}
        >
          <MessageCircle className="h-5 w-5" />
          <span>{post.comments_count}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
