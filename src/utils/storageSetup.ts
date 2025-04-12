
import { supabase } from '@/integrations/supabase/client';

export const setupStorage = async () => {
  try {
    // Check if the profile-images bucket exists
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      console.error("Error checking buckets:", bucketError);
      return;
    }
    
    const profileBucketExists = buckets?.some(bucket => bucket.name === 'profile-images');
    
    if (!profileBucketExists) {
      console.log("Creating profile-images bucket");
      const { error } = await supabase
        .storage
        .createBucket('profile-images', {
          public: true,
          fileSizeLimit: 2097152, // 2MB in bytes
        });
        
      if (error) {
        console.error("Error creating profile-images bucket:", error);
      } else {
        console.log("Successfully created profile-images bucket");
      }
    }
    
  } catch (error) {
    console.error("Storage setup error:", error);
  }
};

// Call this function when the application starts
export const initializeStorage = () => {
  setupStorage().catch(console.error);
};

// Added for compatibility with existing code
export const setupStorageBuckets = setupStorage;

// Function to ensure a bucket exists before using it
export const ensureBucketExists = async (bucketName: string) => {
  try {
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      console.error(`Error checking if bucket "${bucketName}" exists:`, bucketError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket "${bucketName}"`);
      const { error } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 2097152, // 2MB in bytes
        });
        
      if (error) {
        console.error(`Error creating bucket "${bucketName}":`, error);
        return false;
      } else {
        console.log(`Successfully created bucket "${bucketName}"`);
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket "${bucketName}" exists:`, error);
    return false;
  }
};
