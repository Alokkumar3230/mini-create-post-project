import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/db/api';
import type { Post } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import PostCard from '@/components/PostCard';
import CreatePostDialog from '@/components/CreatePostDialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const limit = 10;

  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data, count } = await postsApi.getPosts(page, limit);
      setPosts(data);
      setTotalPages(Math.ceil(count / limit));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [page]);

  const handlePostCreated = () => {
    setPage(1);
    loadPosts();
  };

  const handlePostDeleted = () => {
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feed</h1>
            <p className="text-muted-foreground">See what everyone is sharing</p>
          </div>
          {user && (
            <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Post
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 p-6 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                  <Skeleton className="h-4 w-32 bg-muted" />
                </div>
                <Skeleton className="h-20 w-full bg-muted" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-20 bg-muted" />
                  <Skeleton className="h-8 w-20 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No posts yet</p>
            <p className="text-muted-foreground">Be the first to share something!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>

      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
