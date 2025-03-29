
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
      
      // Create RLS policy for public access to gaming-images bucket
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: 'gaming-images',
        policy_name: 'Public Access Policy'
      });
      
      if (policyError) console.error('Error creating policy for gaming-images:', policyError);
    }
    
    // Check if post-images bucket exists and create it if it doesn't
    const { data: postImagesBucket, error: postImagesBucketError } = await supabase.storage.getBucket('post-images');
    if (postImagesBucketError && postImagesBucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('post-images', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
      });
      
      // Create RLS policy for public access to post-images bucket
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: 'post-images',
        policy_name: 'Public Access Policy'
      });
      
      if (policyError) console.error('Error creating policy for post-images:', policyError);
    }
    
    // Create post-videos bucket if it doesn't exist
    const { data: postVideosBucket, error: postVideosBucketError } = await supabase.storage.getBucket('post-videos');
    if (postVideosBucketError && postVideosBucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('post-videos', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 50, // 50MB limit
      });
      
      // Create RLS policy for public access to post-videos bucket
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: 'post-videos',
        policy_name: 'Public Access Policy'
      });
      
      if (policyError) console.error('Error creating policy for post-videos:', policyError);
    }
    
    // Check if profile-images bucket exists and create it if it doesn't
    const { data: profileImagesBucket, error: profileImagesBucketError } = await supabase.storage.getBucket('profile-images');
    if (profileImagesBucketError && profileImagesBucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('profile-images', {
        public: true, // Make it public by default
        fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
      });
      
      try {
        // Create explicit policies for profile-images bucket
        await supabase.rpc('create_comprehensive_storage_policies', {
          bucket_name: 'profile-images'
        });
        console.log('Created comprehensive policies for profile-images bucket');
      } catch (policyError) {
        console.error('Error creating policies for profile-images:', policyError);
        
        // Fallback: try to create RPC function if it doesn't exist
        const { error: rpcError } = await supabase.rpc('create_storage_rpc_function');
        if (!rpcError) {
          // Try again with the newly created function
          await supabase.rpc('create_comprehensive_storage_policies', {
            bucket_name: 'profile-images'
          });
        }
      }
    }
    
    // Additional RLS management for existing profile-images bucket
    if (!profileImagesBucketError) {
      try {
        // Attempt to create or update policies for existing bucket
        await supabase.rpc('ensure_profile_images_policies');
      } catch (err) {
        console.error('Error updating policies for existing profile-images bucket:', err);
      }
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
        public: true,  // Make all buckets public by default
        fileSizeLimit: fileSizeLimit,
      });
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        return false;
      }
      
      // Create public access policies for the new bucket
      try {
        await supabase.rpc('create_comprehensive_storage_policies', {
          bucket_name: bucketName
        });
      } catch (policyError) {
        console.error(`Error creating policies for ${bucketName}:`, policyError);
      }
      
      console.log(`Successfully created bucket: ${bucketName}`);
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
