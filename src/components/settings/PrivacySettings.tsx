
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeOff, Users, CalendarClock, User, Shield } from "lucide-react";

const PrivacySettings = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [privacy, setPrivacy] = useState({
    profileVisibility: profile?.privacySettings?.profileVisibility || "friends",
    showOnlineStatus: profile?.privacySettings?.showOnlineStatus ?? true,
    showLastSeen: profile?.privacySettings?.showLastSeen ?? true,
    showActivity: profile?.privacySettings?.showActivity ?? true,
    allowFriendRequests: profile?.privacySettings?.allowFriendRequests ?? true,
  });

  const handleToggle = (field: keyof typeof privacy) => {
    if (typeof privacy[field] === "boolean") {
      setPrivacy((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    }
  };

  const handleSelectChange = (field: keyof typeof privacy, value: string) => {
    setPrivacy((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      await updateProfile({
        privacySettings: privacy,
      });
      
      toast({
        title: "Privacy settings saved",
        description: "Your privacy settings have been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error saving your privacy settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-sfu-red" /> Privacy Controls
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-3 text-gray-500" />
                <p className="font-medium">Profile Visibility</p>
              </div>
              <p className="text-sm text-gray-500 ml-8 mb-2">Who can see your profile</p>
              <Select 
                value={privacy.profileVisibility} 
                onValueChange={(value) => handleSelectChange("profileVisibility", value)}
              >
                <SelectTrigger className="w-full ml-8">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Allow Friend Requests</p>
                  <p className="text-sm text-gray-500">People can send you friend requests</p>
                </div>
              </div>
              <Switch 
                checked={privacy.allowFriendRequests as boolean} 
                onCheckedChange={() => handleToggle("allowFriendRequests")} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Show Online Status</p>
                  <p className="text-sm text-gray-500">Others can see when you're online</p>
                </div>
              </div>
              <Switch 
                checked={privacy.showOnlineStatus as boolean} 
                onCheckedChange={() => handleToggle("showOnlineStatus")} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarClock className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Show Last Seen</p>
                  <p className="text-sm text-gray-500">Others can see when you were last active</p>
                </div>
              </div>
              <Switch 
                checked={privacy.showLastSeen as boolean} 
                onCheckedChange={() => handleToggle("showLastSeen")} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <EyeOff className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Activity Visibility</p>
                  <p className="text-sm text-gray-500">Show your activity to others</p>
                </div>
              </div>
              <Switch 
                checked={privacy.showActivity as boolean} 
                onCheckedChange={() => handleToggle("showActivity")} 
              />
            </div>
          </div>
          
          <Button 
            className="w-full mt-6" 
            onClick={handleSavePrivacy} 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Privacy Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacySettings;
