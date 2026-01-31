import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { commentsApi } from '@/db/api';
import type { Comment } from '@/types/index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
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

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
}

export default function CommentSection({
  postId,
  comments,
  onCommentAdded,
  onCommentDeleted,
}: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast({
        title: 'Login Required',
        description: 'Please login to comment',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Empty Comment',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const comment = await commentsApi.createComment(user.id, profile.username, {
        post_id: postId,
        content: content.trim(),
      });
      onCommentAdded(comment);
      setContent('');
      toast({
        title: 'Success',
        description: 'Comment added',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentsApi.deleteComment(commentId);
      onCommentDeleted(commentId);
      toast({
        title: 'Success',
        description: 'Comment deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Comment'
              )}
            </Button>
          </form>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                    {getInitials(comment.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{comment.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {user?.id === comment.user_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this comment?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(comment.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
