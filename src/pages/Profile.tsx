import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from "@/components/ui/button";
import { Edit, Camera, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [showCoverPhotoModal, setShowCoverPhotoModal] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [batch, setBatch] = useState(profile?.batch || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState<string>(profile?.interests?.join(', ') || '');
  const [availability, setAvailability] = useState(profile?.availability || '');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [coverPic, setCoverPic] = useState<File | null>(null);
  const isCurrentUser = true;

  const handleUpdateProfile = async () => {
    if (!user) return;

    const updatedProfileData = {
      name,
      major,
      batch,
      bio,
      interests: interests.split(',').map(item => item.trim()),
      availability,
    };

    try {
      await updateProfile(user.id, updatedProfileData);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setShowEditProfileModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfilePhotoUpdate = async () => {
    if (!user || !profilePic) return;

    try {
      // Upload the new profile picture to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(`${user.id}/profile-pic-${Date.now()}.${profilePic.name.split('.').pop()}`, profilePic, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get the public URL of the uploaded image
      const profilePicURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${data.path}`;

      // Update the user's profile with the new profile picture URL
      await updateProfile(user.id, { profilePic: profilePicURL });

      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been updated successfully.",
      });
      setShowProfilePhotoModal(false);
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCoverPhotoUpdate = async () => {
    if (!user || !coverPic) return;

    try {
      // Upload the new cover photo to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(`${user.id}/cover-pic-${Date.now()}.${coverPic.name.split('.').pop()}`, coverPic, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get the public URL of the uploaded image
      const coverPicURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${data.path}`;

      // Update the user's profile with the new cover photo URL
      await updateProfile(user.id, { coverPic: coverPicURL });

      toast({
        title: "Cover photo updated",
        description: "Your cover photo has been updated successfully.",
      });
      setShowCoverPhotoModal(false);
    } catch (error) {
      console.error("Error updating cover photo:", error);
      toast({
        title: "Update failed",
        description: "Failed to update cover photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16 pb-16">
        {/* Cover Photo and Profile Details */}
        <div className="relative">
          <div className="h-60 w-full bg-sfu-red/20 overflow-hidden relative">
            {profile && profile.coverPic ? (
              <img
                src={profile.coverPic}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-sfu-red/30 to-sfu-red/10 flex items-center justify-center">
                <span className="text-white/70 text-lg">No cover photo</span>
              </div>
            )}
            
            {/* Edit cover photo button */}
            {isCurrentUser && (
              <button
                onClick={() => setShowCoverPhotoModal(true)}
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-sfu-red py-1 px-3 rounded-md text-sm font-medium shadow-md flex items-center gap-1"
              >
                <Camera size={14} />
                Update Cover
              </button>
            )}
          </div>
          
          {/* Profile Picture */}
          <div className="absolute -bottom-16 left-8 rounded-full border-4 border-white shadow-md overflow-hidden">
            <div className="w-32 h-32 bg-sfu-red/20 rounded-full overflow-hidden">
              {profile && profile.profilePic ? (
                <img
                  src={profile.profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-sfu-lightgray flex items-center justify-center">
                  <User size={40} className="text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Edit profile picture button */}
            {isCurrentUser && (
              <button
                onClick={() => setShowProfilePhotoModal(true)}
                className="absolute bottom-0 right-0 bg-white hover:bg-gray-100 text-sfu-red p-1.5 rounded-full shadow-md"
              >
                <Camera size={16} />
              </button>
            )}
          </div>
        </div>
        
        {/* Profile Info and Tabs */}
        <div className="container-narrow max-w-6xl mx-auto px-4 mt-20">
          {/* Profile Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">{profile?.name || 'Student'}</h1>
              <p className="text-gray-600">{profile?.major || 'Major'} • {profile?.batch || 'Batch'}</p>
            </div>
            
            {isCurrentUser && (
              <div>
                <Button 
                  onClick={() => setShowEditProfileModal(true)}
                  variant="outline" 
                  className="flex items-center gap-1"
                >
                  <Edit size={14} />
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
          
          {/* Profile Body */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* About Section */}
            <div className="md:col-span-2">
              <div className="bg-sfu-lightgray p-6 rounded-xl">
                <h2 className="text-lg font-semibold mb-4">About</h2>
                <p className="text-gray-700">{profile?.bio || 'No bio provided.'}</p>
                
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">Interests</h3>
                  <p className="text-gray-700">{profile?.interests?.join(', ') || 'No interests provided.'}</p>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">Availability</h3>
                  <p className="text-gray-700">{profile?.availability || 'No availability provided.'}</p>
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div>
              <div className="bg-sfu-lightgray p-6 rounded-xl">
                <h2 className="text-lg font-semibold mb-4">Contact</h2>
                <p className="text-gray-700">Email: {user?.email || 'N/A'}</p>
                <p className="text-gray-700">Student ID: {profile?.student_id || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="major" className="text-right">
                Major
              </Label>
              <Input id="major" value={major} onChange={(e) => setMajor(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="batch" className="text-right">
                Batch
              </Label>
              <Input id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bio" className="text-right mt-2">
                Bio
              </Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="interests" className="text-right mt-2">
                Interests
              </Label>
              <Textarea id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="availability" className="text-right mt-2">
                Availability
              </Label>
              <Textarea id="availability" value={availability} onChange={(e) => setAvailability(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <Button onClick={handleUpdateProfile}>Save changes</Button>
        </DialogContent>
      </Dialog>

      {/* Profile Photo Modal */}
      <Dialog open={showProfilePhotoModal} onOpenChange={setShowProfilePhotoModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Upload a new photo to update your profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profilePic" className="text-right">
                New Photo
              </Label>
              <Input
                type="file"
                id="profilePic"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setProfilePic(e.target.files[0]);
                  }
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleProfilePhotoUpdate} disabled={!profilePic}>Update Photo</Button>
        </DialogContent>
      </Dialog>

      {/* Cover Photo Modal */}
      <Dialog open={showCoverPhotoModal} onOpenChange={setShowCoverPhotoModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Cover Photo</DialogTitle>
            <DialogDescription>
              Upload a new photo to update your cover picture.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coverPic" className="text-right">
                New Photo
              </Label>
              <Input
                type="file"
                id="coverPic"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setCoverPic(e.target.files[0]);
                  }
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleCoverPhotoUpdate} disabled={!coverPic}>Update Photo</Button>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Profile;
