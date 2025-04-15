
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, User, Mail, Phone } from "lucide-react";

const ProfileDetails = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    major: profile?.major || "",
    batch: profile?.batch || "",
    student_id: profile?.student_id || "",
  });

  // Update form when profile data changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        major: profile.major || "",
        batch: profile.batch || "",
        student_id: profile.student_id || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        major: formData.major,
        batch: formData.batch,
        student_id: formData.student_id,
        // Don't include email if it hasn't changed (email changes require verification)
        ...(formData.email !== profile?.email && { email: formData.email }),
      });

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Profile Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID</Label>
            <Input
              id="student_id"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              placeholder="Your student ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="major">Major</Label>
            <Input
              id="major"
              name="major"
              value={formData.major}
              onChange={handleChange}
              placeholder="Your major"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch">Batch</Label>
            <Input
              id="batch"
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              placeholder="Your batch"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
            className="resize-none h-32"
          />
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

export default ProfileDetails;
