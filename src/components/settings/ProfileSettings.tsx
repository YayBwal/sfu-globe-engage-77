
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail, User, Phone, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ProfileSettings = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
  });
  const [profilePic, setProfilePic] = useState(profile?.profilePic || null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingProfilePic(true);

    try {
      if (!profile?.id) {
        throw new Error("User ID not found");
      }

      // Upload to Supabase storage
      const filePath = `${profile.id}/profile-${new Date().getTime()}`;
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

      setProfilePic(publicUrl);

      toast({
        title: "Success",
        description: "Profile picture updated",
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your profile picture.",
      });
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        name: formData.name,
        profilePic: profilePic,
        // Don't include email if it hasn't changed (email changes require verification)
        ...(formData.email !== profile?.email && { email: formData.email }),
        phone: formData.phone,
      });

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-2 border-white shadow-lg">
            <AvatarImage src={profilePic || profile?.profilePic} alt={profile?.name} />
            <AvatarFallback className="bg-gradient-to-br from-sfu-red to-amber-500 text-white text-xl">
              {profile?.name ? getInitials(profile.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 bg-sfu-red text-white p-2 rounded-full cursor-pointer shadow-md transition-all duration-300 hover:bg-sfu-red/90 hover:shadow-lg">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureChange}
              disabled={uploadingProfilePic}
            />
            <Camera size={16} />
          </label>
        </div>
        {uploadingProfilePic && <p className="text-xs text-gray-500">Uploading...</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="flex items-center space-x-2">
            <User size={18} className="text-gray-500" />
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex items-center space-x-2">
            <Mail size={18} className="text-gray-500" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="youremail@example.com"
              disabled={true} // Email changes should go through auth system
            />
          </div>
          <p className="text-xs text-gray-500">Email cannot be changed directly due to verification requirements.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex items-center space-x-2">
            <Phone size={18} className="text-gray-500" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Profile Changes
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default ProfileSettings;
