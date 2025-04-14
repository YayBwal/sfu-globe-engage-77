
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
      console.log("Profile-images bucket doesn't exist. The bucket should be created via SQL migrations.");
    } else {
      console.log("Profile-images bucket exists.");
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
    
    return buckets?.some(bucket => bucket.name === bucketName) || false;
  } catch (error) {
    console.error(`Error ensuring bucket "${bucketName}" exists:`, error);
    return false;
  }
};
