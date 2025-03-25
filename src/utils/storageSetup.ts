
import { supabase } from "@/integrations/supabase/client";

export const setupStorageBuckets = async () => {
  try {
    // Check if post-images bucket exists and create it if it doesn't
    const { data: imagesBucket, error: imagesBucketError } = await supabase.storage.getBucket('post-images');
    if (imagesBucketError && imagesBucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('post-images', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
      });
    }
    
    // Check if post-videos bucket exists and create it if it doesn't
    const { data: videosBucket, error: videosBucketError } = await supabase.storage.getBucket('post-videos');
    if (videosBucketError && videosBucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('post-videos', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10, // 10MB limit
      });
    }
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
  }
};
