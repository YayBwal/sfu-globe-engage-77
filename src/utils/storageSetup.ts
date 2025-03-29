
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
    
    // Create additional policy for profile-images bucket to fix upload permission error
    try {
      const policyName = "Public access to profile-images";
      await supabase.rpc('create_storage_policy', {
        bucket_name: 'profile-images',
        policy_name: policyName,
        definition: `bucket_id = 'profile-images'`, 
        operation: 'ALL',
        role_name: 'anon'
      });
    } catch (policyError) {
      console.log('Policy might already exist or could not be created:', policyError);
    }
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
  }
};

// Add the missing function to check if a bucket exists and create it if it doesn't
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    // If bucket doesn't exist, create it
    if (error && error.message.includes('The resource was not found')) {
      // Configure size limit based on bucket name
      let fileSizeLimit = 1024 * 1024 * 5; // Default 5MB
      
      if (bucketName.includes('video')) {
        fileSizeLimit = 1024 * 1024 * 50; // 50MB for videos
      } else if (bucketName.includes('image')) {
        fileSizeLimit = 1024 * 1024 * 5; // 5MB for images
      } else if (bucketName.includes('logo')) {
        fileSizeLimit = 1024 * 1024 * 2; // 2MB for logos
      }
      
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: fileSizeLimit,
      });
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        return false;
      }
      
      // After creating the bucket, add public policies
      try {
        const policyName = `Public access to ${bucketName}`;
        await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: policyName,
          definition: `bucket_id = '${bucketName}'`, 
          operation: 'ALL',
          role_name: 'anon'
        });
      } catch (policyError) {
        console.log(`Policy for ${bucketName} might already exist:`, policyError);
      }
    } else if (error) {
      console.error(`Error checking bucket ${bucketName}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
};
