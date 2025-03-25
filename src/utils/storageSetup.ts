
import { supabase } from '@/integrations/supabase/client';

export const setupStorageBuckets = async () => {
  try {
    // Check if gaming-images bucket exists and create it if it doesn't
    const { data: gamingImagesBucket, error: gamingImagesBucketError } = await supabase.storage.getBucket('gaming-images');
    if (gamingImagesBucketError && gamingImagesBucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('gaming-images', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 3, // 3MB limit
      });
    }
    
    // Check if post-images bucket exists and create it if it doesn't
    const { data: postImagesBucket, error: postImagesBucketError } = await supabase.storage.getBucket('post-images');
    if (postImagesBucketError && postImagesBucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('post-images', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
      });
    }
    
    // Create post-videos bucket if it doesn't exist
    const { data: postVideosBucket, error: postVideosBucketError } = await supabase.storage.getBucket('post-videos');
    if (postVideosBucketError && postVideosBucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('post-videos', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 50, // 50MB limit
      });
    }
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
  }
};
