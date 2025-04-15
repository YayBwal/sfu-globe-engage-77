
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Smartphone, MessageSquare, Users, Calendar, ShoppingCart, Bell } from "lucide-react";
import { NotificationPreferences } from "@/types/auth";

const ProfileNotifications = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Default notification preferences if not set in profile
  const defaultPreferences: NotificationPreferences = {
    email: true,
    sms: false,
    app: true,
    messages: true,
    friends: true,
    events: true,
    marketplace: false
  };
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    profile?.notificationPreferences || defaultPreferences
  );
  
  useEffect(() => {
    if (profile?.notificationPreferences) {
      setPreferences(profile.notificationPreferences);
    }
  }, [profile]);
  
  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const savePreferences = async () => {
    setLoading(true);
    try {
      await updateProfile({
        notificationPreferences: preferences
      });
      
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved."
      });
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem saving your notification preferences."
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Notification Settings</h3>
      
      <Card>
        <CardContent className="pt-6">
          <h4 className="text-md font-medium mb-4 flex items-center">
            <Bell className="mr-2 h-5 w-5 text-sfu-red" /> Notification Channels
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch 
                id="email-notifications"
                checked={preferences.email}
                onCheckedChange={() => handleToggle('email')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
              <Switch 
                id="sms-notifications"
                checked={preferences.sms}
                onCheckedChange={() => handleToggle('sms')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="app-notifications">App Notifications</Label>
                <p className="text-sm text-gray-500">Receive in-app notifications</p>
              </div>
              <Switch 
                id="app-notifications"
                checked={preferences.app}
                onCheckedChange={() => handleToggle('app')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h4 className="text-md font-medium mb-4">Notification Types</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-3 text-blue-500" />
                <div className="space-y-0.5">
                  <Label htmlFor="messages-notifications">Messages</Label>
                  <p className="text-sm text-gray-500">Notifications about new messages</p>
                </div>
              </div>
              <Switch 
                id="messages-notifications"
                checked={preferences.messages}
                onCheckedChange={() => handleToggle('messages')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-green-500" />
                <div className="space-y-0.5">
                  <Label htmlFor="friends-notifications">Friends</Label>
                  <p className="text-sm text-gray-500">Friend requests and updates</p>
                </div>
              </div>
              <Switch 
                id="friends-notifications"
                checked={preferences.friends}
                onCheckedChange={() => handleToggle('friends')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-purple-500" />
                <div className="space-y-0.5">
                  <Label htmlFor="events-notifications">Events</Label>
                  <p className="text-sm text-gray-500">Event invitations and updates</p>
                </div>
              </div>
              <Switch 
                id="events-notifications"
                checked={preferences.events}
                onCheckedChange={() => handleToggle('events')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-3 text-amber-500" />
                <div className="space-y-0.5">
                  <Label htmlFor="marketplace-notifications">Marketplace</Label>
                  <p className="text-sm text-gray-500">Updates about marketplace items</p>
                </div>
              </div>
              <Switch 
                id="marketplace-notifications"
                checked={preferences.marketplace}
                onCheckedChange={() => handleToggle('marketplace')}
              />
            </div>
          </div>

          <Button 
            className="w-full mt-6" 
            onClick={savePreferences}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Notification Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileNotifications;
