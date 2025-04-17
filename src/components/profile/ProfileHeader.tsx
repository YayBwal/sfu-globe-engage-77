
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Camera, PenSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileHeaderProps {
  profile: UserProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState<'profile' | 'cover' | null>(null);
  const [coverPic, setCoverPic] = useState<string | null>(profile.coverPic || null);
  const [profilePic, setProfilePic] = useState<string | null>(profile.profilePic || null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'cover'
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(type);

    try {
      if (!profile?.id) {
        throw new Error("User ID not found");
      }

      // Upload to Supabase storage
      const filePath = `${profile.id}/${type}-${new Date().getTime()}`;
      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, {
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-images")
        .getPublicUrl(data.path);

      // Update local state
      if (type === 'profile') {
        setProfilePic(publicUrl);
      } else {
        setCoverPic(publicUrl);
      }

      // Update profile in database
      await updateProfile({
        [type === 'profile' ? 'profilePic' : 'coverPic']: publicUrl
      });

      toast({
        title: "Success",
        description: `${type === 'profile' ? 'Profile' : 'Cover'} picture updated`,
      });
    } catch (error) {
      console.error(`Error uploading ${type} picture:`, error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: `There was an error uploading your ${type === 'profile' ? 'profile' : 'cover'} picture.`,
      });
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="relative">
      {/* Cover Photo */}
      <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-xl overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300">
        {coverPic ? (
          <img 
            src={coverPic} 
            alt="Cover" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-sfu-red/80 to-amber-500/80 flex items-center justify-center">
            <span className="text-white text-lg md:text-xl">SFU Connect</span>
          </div>
        )}
        
        {/* Cover Photo Upload Button */}
        <label className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full cursor-pointer shadow-md transition-all duration-300 flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'cover')}
            disabled={!!isUploading}
          />
          <Camera size={16} />
          <span className="text-sm font-medium pr-1">
            {isUploading === 'cover' ? 'Uploading...' : 'Change Cover'}
          </span>
        </label>
      </div>
      
      {/* Profile Picture */}
      <div className="absolute -bottom-16 left-8">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
            <AvatarImage src={profilePic || profile.profilePic} alt={profile.name} />
            <AvatarFallback className="bg-gradient-to-br from-sfu-red to-amber-500 text-white text-3xl">
              {profile?.name ? getInitials(profile.name) : "U"}
            </AvatarFallback>
          </Avatar>
          
          {/* Profile Picture Upload Button */}
          <label className="absolute bottom-2 right-2 bg-sfu-red text-white p-2 rounded-full cursor-pointer shadow-md transition-all duration-300 hover:bg-sfu-red/90 hover:shadow-lg">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'profile')}
              disabled={!!isUploading}
            />
            <Camera size={16} />
          </label>
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="mt-20 pl-8 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
          <p className="text-gray-600">{profile.major} • {profile.batch}</p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 md:mt-0"
        >
          <PenSquare className="mr-2 h-4 w-4" />
          Edit Bio
        </Button>
      </div>
    </div>
  );
};

export default ProfileHeader;
