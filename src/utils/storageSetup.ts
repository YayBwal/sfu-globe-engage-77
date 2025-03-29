
import { supabase } from '@/integrations/supabase/client';

export const setupStorageBuckets = async () => {
  try {
    // Check if buckets exist and create them if they don't
    const buckets = [
      { name: 'gaming-images', sizeLimit: 3 }, // 3MB limit
      { name: 'post-images', sizeLimit: 5 },   // 5MB limit
      { name: 'post-videos', sizeLimit: 50 },  // 50MB limit
      { name: 'profile-images', sizeLimit: 2 } // 2MB limit
    ];
    
    for (const bucket of buckets) {
      await ensureBucketExists(bucket.name);
    }
    
    console.log('Storage buckets setup completed successfully');
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
  }
};

// Function to check if a bucket exists and create it if it doesn't
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
        console.log(`Successfully created policies for bucket: ${bucketName}`);
      } catch (policyError) {
        console.error(`Error creating policies for ${bucketName}:`, policyError);
      }
      
      console.log(`Successfully created bucket: ${bucketName}`);
    } else if (error) {
      console.error(`Error checking bucket ${bucketName}:`, error);
      return false;
    } else {
      // Bucket exists, ensure it has proper policies
      try {
        if (bucketName === 'profile-images') {
          await supabase.rpc('ensure_profile_images_policies');
          console.log('Ensured profile-images policies are up to date');
        } else {
          await supabase.rpc('create_comprehensive_storage_policies', {
            bucket_name: bucketName
          });
          console.log(`Ensured policies for ${bucketName} are up to date`);
        }
      } catch (policyError) {
        console.error(`Error updating policies for ${bucketName}:`, policyError);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
};
