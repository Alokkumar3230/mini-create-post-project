import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi, storageApi } from '@/db/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Image, Loader2, X } from 'lucide-react';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export default function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 1MB',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    if (!content.trim() && !imageFile) {
      toast({
        title: 'Empty Post',
        description: 'Please add some content or an image',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await storageApi.uploadImage(imageFile);
      }

      await postsApi.createPost(user.id, profile.username, {
        content: content.trim() || undefined,
        image_url: imageUrl,
      });

      toast({
        title: 'Success',
        description: 'Post created successfully',
      });

      setContent('');
      setImageFile(null);
      setImagePreview(null);
      onOpenChange(false);
      onPostCreated();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share your thoughts or upload an image
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Image (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={loading}
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg object-cover max-h-64"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Image className="mr-2 h-4 w-4" />
                Select Image
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum file size: 1MB. Supported formats: JPEG, PNG, GIF, WEBP
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Post'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
