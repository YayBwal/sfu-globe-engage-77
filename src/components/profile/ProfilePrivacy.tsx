
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Clock, Activity, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrivacySettings } from "@/types/auth";

const ProfilePrivacy = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Default privacy settings if not set in profile
  const defaultPrivacy: PrivacySettings = {
    profileVisibility: "everyone",
    showOnlineStatus: true,
    showLastSeen: true,
    showActivity: true,
    allowFriendRequests: true
  };
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(
    profile?.privacySettings || defaultPrivacy
  );
  
  useEffect(() => {
    if (profile?.privacySettings) {
      setPrivacySettings(profile.privacySettings);
    }
  }, [profile]);
  
  const handleToggle = (key: keyof PrivacySettings) => {
    if (typeof privacySettings[key] === 'boolean') {
      setPrivacySettings(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };
  
  const handleSelectChange = (value: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      profileVisibility: value
    }));
  };
  
  const saveSettings = async () => {
    setLoading(true);
    try {
      await updateProfile({
        privacySettings: privacySettings
      });
      
      toast({
        title: "Settings updated",
        description: "Your privacy settings have been saved."
      });
    } catch (error) {
      console.error("Failed to update privacy settings:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem saving your privacy settings."
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Privacy Settings</h3>
      
      <Card>
        <CardContent className="pt-6">
          <h4 className="text-md font-medium mb-4 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-sfu-red" /> Profile Privacy
          </h4>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profile-visibility">Profile Visibility</Label>
              <Select 
                value={privacySettings.profileVisibility} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select who can see your profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Control who can view your full profile information</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="online-status" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2 text-gray-500" />
                  Show Online Status
                </Label>
                <p className="text-sm text-gray-500">Let others see when you're online</p>
              </div>
              <Switch 
                id="online-status"
                checked={privacySettings.showOnlineStatus}
                onCheckedChange={() => handleToggle('showOnlineStatus')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="last-seen" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  Show Last Seen
                </Label>
                <p className="text-sm text-gray-500">Let others see when you were last active</p>
              </div>
              <Switch 
                id="last-seen"
                checked={privacySettings.showLastSeen}
                onCheckedChange={() => handleToggle('showLastSeen')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activity" className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-gray-500" />
                  Show Activity
                </Label>
                <p className="text-sm text-gray-500">Let others see your recent activities</p>
              </div>
              <Switch 
                id="activity"
                checked={privacySettings.showActivity}
                onCheckedChange={() => handleToggle('showActivity')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="friend-requests" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2 text-gray-500" />
                  Allow Friend Requests
                </Label>
                <p className="text-sm text-gray-500">Let others send you friend requests</p>
              </div>
              <Switch 
                id="friend-requests"
                checked={privacySettings.allowFriendRequests}
                onCheckedChange={() => handleToggle('allowFriendRequests')}
              />
            </div>
          </div>

          <Button 
            className="w-full mt-6" 
            onClick={saveSettings}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Privacy Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePrivacy;
