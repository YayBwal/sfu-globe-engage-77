
import { supabase } from "@/integrations/supabase/client";

export const setupStorageBuckets = async () => {
  try {
    // Create post-images bucket if it doesn't exist
    try {
      const { data: imagesBucket, error: imagesBucketError } = await supabase.storage.getBucket('post-images');
      if (imagesBucketError && imagesBucketError.message.includes('Bucket not found')) {
        const { error: createError } = await supabase.storage.createBucket('post-images', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
        });
        
        if (createError) {
          console.error("Error creating post-images bucket:", createError);
        } else {
          console.log("Created post-images bucket successfully");
        }
      }
    } catch (err) {
      console.error("Error checking/creating post-images bucket:", err);
    }
    
    // Create post-videos bucket if it doesn't exist
    try {
      const { data: videosBucket, error: videosBucketError } = await supabase.storage.getBucket('post-videos');
      if (videosBucketError && videosBucketError.message.includes('Bucket not found')) {
        const { error: createError } = await supabase.storage.createBucket('post-videos', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 10, // 10MB limit
        });
        
        if (createError) {
          console.error("Error creating post-videos bucket:", createError);
        } else {
          console.log("Created post-videos bucket successfully");
        }
      }
    } catch (err) {
      console.error("Error checking/creating post-videos bucket:", err);
    }
    
    // Set up RLS policy for public access to the buckets
    // This requires admin privileges, so we won't add it here
    // but it's something to consider for a production setup
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
  }
};
