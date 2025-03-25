
import { supabase } from "@/integrations/supabase/client";

export const setupStorageBuckets = async () => {
  try {
    // Create post-images bucket if it doesn't exist
    try {
      const { data: imagesBucket, error: imagesBucketError } = await supabase.storage.getBucket('post-images');
      
      if (imagesBucketError && (imagesBucketError.message.includes('Bucket not found') || imagesBucketError.message.includes('The resource was not found'))) {
        const { error: createError } = await supabase.storage.createBucket('post-images', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
        });
        
        if (createError) {
          console.error("Error creating post-images bucket:", createError);
          // If we can't create the bucket due to permissions, we'll check if it exists later when trying to upload
        } else {
          console.log("Created post-images bucket successfully");
        }
      } else if (imagesBucket) {
        console.log("post-images bucket already exists");
      }
    } catch (err) {
      console.error("Error checking/creating post-images bucket:", err);
    }
    
    // Create post-videos bucket if it doesn't exist
    try {
      const { data: videosBucket, error: videosBucketError } = await supabase.storage.getBucket('post-videos');
      
      if (videosBucketError && (videosBucketError.message.includes('Bucket not found') || videosBucketError.message.includes('The resource was not found'))) {
        const { error: createError } = await supabase.storage.createBucket('post-videos', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 10, // 10MB limit
        });
        
        if (createError) {
          console.error("Error creating post-videos bucket:", createError);
          // If we can't create the bucket due to permissions, we'll check if it exists later when trying to upload
        } else {
          console.log("Created post-videos bucket successfully");
        }
      } else if (videosBucket) {
        console.log("post-videos bucket already exists");
      }
    } catch (err) {
      console.error("Error checking/creating post-videos bucket:", err);
    }
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
  }
};

// Helper to check if a bucket exists before trying to use it
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error && (error.message.includes('Bucket not found') || error.message.includes('The resource was not found'))) {
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error(`Error checking if bucket ${bucketName} exists:`, err);
    return false;
  }
};
