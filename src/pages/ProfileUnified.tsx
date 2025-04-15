
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/layout/Header";
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Lock, 
  Paintbrush, 
  AlertTriangle,
  Edit2,
  Camera,
  ArrowLeft,
  LogOut
} from "lucide-react";
import ProfileDetails from "@/components/profile/ProfileDetails";
import ProfileSecurity from "@/components/profile/ProfileSecurity";
import ProfileAppearance from "@/components/profile/ProfileAppearance";
import ProfileNotifications from "@/components/profile/ProfileNotifications";
import ProfilePrivacy from "@/components/profile/ProfilePrivacy";
import ProfileDangerZone from "@/components/profile/ProfileDangerZone";
import { supabase } from "@/integrations/supabase/client";

const ProfileUnified = () => {
  const { profile, user, logout, updateProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (value: string) => {
    // Make sure event is completely handled before changing tab
    setTimeout(() => {
      setActiveTab(value);
    }, 0);
  };

  const uploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      setUploadingProfile(true);
      
      // Upload to Supabase storage
      const filePath = `${user?.id}/profile-${new Date().getTime()}`;
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);
      
      // Update profile
      await updateProfile({ profilePic: publicUrl });
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your profile picture.",
        variant: "destructive",
      });
    } finally {
      setUploadingProfile(false);
    }
  };
  
  const uploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      setUploadingCover(true);
      
      // Upload to Supabase storage
      const filePath = `${user?.id}/cover-${new Date().getTime()}`;
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);
      
      // Update profile
      await updateProfile({ coverPic: publicUrl });
      
      toast({
        title: "Cover image updated",
        description: "Your cover image has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your cover image.",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">You are not logged in</h2>
          <p className="mb-6">Please log in to view your profile</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={18} />, component: <ProfileDetails /> },
    { id: "security", label: "Security", icon: <ShieldCheck size={18} />, component: <ProfileSecurity /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} />, component: <ProfileNotifications /> },
    { id: "privacy", label: "Privacy", icon: <Lock size={18} />, component: <ProfilePrivacy /> },
    { id: "appearance", label: "Appearance", icon: <Paintbrush size={18} />, component: <ProfileAppearance /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={18} className="text-red-500" />, component: <ProfileDangerZone />, danger: true }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <main className="pt-16 pb-16">
        {/* Cover Photo Section */}
        <div className="relative w-full">
          <div className="h-64 sm:h-80 w-full bg-gradient-to-r from-blue-500 to-sfu-red overflow-hidden">
            {profile?.coverPic ? (
              <img 
                src={profile.coverPic} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sfu-red via-amber-500 to-sfu-lightgray opacity-80" />
            )}
            
            <div className="absolute inset-0 bg-black/10" />
            
            {/* Cover Photo Upload Button */}
            <label 
              className="absolute top-4 right-4 bg-white/30 hover:bg-white/50 cursor-pointer text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition flex items-center gap-2 shadow-lg"
            >
              <Camera className="h-4 w-4" />
              Change Cover
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadCoverImage}
                disabled={uploadingCover}
              />
            </label>
          </div>
        </div>
        
        {/* Profile Info Section */}
        <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 pt-24 md:pt-6 relative">
            <div className="flex flex-col md:flex-row gap-6 relative">
              {/* Profile Picture - Position it so it overlaps the cover image */}
              <div className="absolute -top-20 left-1/2 md:left-8 transform -translate-x-1/2 md:translate-x-0 flex justify-center z-20">
                <div className="relative group">
                  <Avatar className="h-36 w-36 border-4 border-white shadow-xl">
                    <AvatarImage src={profile?.profilePic} alt={profile?.name} className="object-cover" />
                    <AvatarFallback className="text-4xl font-medium bg-gradient-to-br from-sfu-red to-amber-500 text-white">
                      {profile ? getInitials(profile.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-sfu-red to-amber-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadProfileImage}
                      disabled={uploadingProfile}
                    />
                  </label>
                </div>
              </div>
              
              {/* Profile Info Content */}
              <div className="flex flex-col md:flex-row justify-between items-start mt-8 md:mt-0 w-full">
                <div className="flex-1 md:pl-44 text-center md:text-left">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full">
                    <div>
                      <h1 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        {profile?.name}
                      </h1>
                      <p className="text-gray-500">{profile?.email}</p>
                      {profile?.bio && (
                        <p className="text-gray-700 mt-3 max-w-xl">{profile.bio}</p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                      <Button 
                        variant="outline" 
                        className="rounded-lg border-slate-200 hover:bg-gray-100 hover:text-sfu-black"
                        onClick={handleLogout}
                        disabled={isSubmitting}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Signing out..." : "Sign Out"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Settings Tabs */}
            <div className="mt-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <ul className="space-y-1">
                      {tabs.map((tab) => (
                        <li key={tab.id}>
                          <button
                            onClick={() => handleTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-md transition-all duration-200 ${
                              activeTab === tab.id
                                ? tab.danger
                                  ? "bg-red-50 text-red-600 font-medium"
                                  : "bg-white shadow-sm text-sfu-red font-medium"
                                : "hover:bg-white/80"
                            }`}
                            type="button"
                          >
                            <span className={activeTab === tab.id && !tab.danger ? "text-sfu-red" : ""}>
                              {tab.icon}
                            </span>
                            <span>{tab.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Content Area */}
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    {tabs.find(tab => tab.id === activeTab)?.component}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileUnified;
