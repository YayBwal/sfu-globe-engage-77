
import React, { useState, useRef } from 'react';
import { 
  Image, Smile, MapPin, X, FileVideo
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CreatePostFormProps {
  onPostCreated: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Function to handle media file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    setMediaFile(file);
    setMediaType(type);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Function to remove selected media
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Function to handle post submission
  const handleSubmitPost = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create posts",
        variant: "destructive"
      });
      return;
    }
    
    if (!postContent.trim() && !mediaFile) {
      toast({
        title: "Empty post",
        description: "Please add text or media to your post",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let mediaUrl = null;
      
      // Upload media file if exists
      if (mediaFile && mediaType) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError, data: uploadData } = await supabase
          .storage
          .from(mediaType === 'image' ? 'post-images' : 'post-videos')
          .upload(filePath, mediaFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: urlData } = supabase
          .storage
          .from(mediaType === 'image' ? 'post-images' : 'post-videos')
          .getPublicUrl(filePath);
          
        mediaUrl = urlData.publicUrl;
      }
      
      // Create post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postContent.trim(),
          media_url: mediaUrl,
          media_type: mediaType || 'none',
        });
        
      if (postError) {
        throw postError;
      }
      
      // Reset form
      setPostContent('');
      handleRemoveMedia();
      
      // Notify parent component
      onPostCreated();
      
      toast({
        title: "Post created",
        description: "Your post has been published"
      });
      
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.profile_pic} />
            <AvatarFallback className="bg-sfu-red text-white">
              {profile ? profile.name.charAt(0) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="What's on your mind?"
              className="w-full resize-none border-none focus-visible:ring-0 p-0 min-h-[80px]"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />
            
            {/* Media preview */}
            {mediaPreview && (
              <div className="relative mt-3 rounded-md overflow-hidden border">
                <button 
                  className="absolute top-2 right-2 bg-gray-900/70 text-white rounded-full p-1"
                  onClick={handleRemoveMedia}
                >
                  <X className="h-4 w-4" />
                </button>
                
                {mediaType === 'image' ? (
                  <img 
                    src={mediaPreview} 
                    alt="Upload preview" 
                    className="max-h-80 w-auto mx-auto"
                  />
                ) : (
                  <video 
                    src={mediaPreview} 
                    controls
                    className="max-h-80 w-auto mx-auto"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-2">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'image')}
          />
          <input
            type="file"
            ref={videoInputRef}
            className="hidden"
            accept="video/*"
            onChange={(e) => handleFileChange(e, 'video')}
          />
          
          {/* Media buttons */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-4 w-4 mr-1" /> Photo
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500"
            onClick={() => videoInputRef.current?.click()}
          >
            <FileVideo className="h-4 w-4 mr-1" /> Video
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500">
            <Smile className="h-4 w-4 mr-1" /> Feeling
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500">
            <MapPin className="h-4 w-4 mr-1" /> Location
          </Button>
        </div>
        <Button 
          className="bg-sfu-red hover:bg-sfu-red/90"
          disabled={isSubmitting || (!postContent.trim() && !mediaFile)}
          onClick={handleSubmitPost}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </CardFooter>
    </Card>
  );
};
