
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Mail, MessageSquare, Users, Calendar, ShoppingBag } from "lucide-react";

const NotificationSettings = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: profile?.notificationPreferences?.email ?? true,
    smsNotifications: profile?.notificationPreferences?.sms ?? false,
    appNotifications: profile?.notificationPreferences?.app ?? true,
    newMessages: profile?.notificationPreferences?.messages ?? true,
    friendRequests: profile?.notificationPreferences?.friends ?? true,
    upcomingEvents: profile?.notificationPreferences?.events ?? true,
    marketplaceUpdates: profile?.notificationPreferences?.marketplace ?? false,
  });

  const handleToggle = (field: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await updateProfile({
        notificationPreferences: {
          email: preferences.emailNotifications,
          sms: preferences.smsNotifications,
          app: preferences.appNotifications,
          messages: preferences.newMessages,
          friends: preferences.friendRequests,
          events: preferences.upcomingEvents,
          marketplace: preferences.marketplaceUpdates,
        },
      });
      
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error saving your notification preferences.",
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
            <Bell className="mr-2 h-5 w-5 text-sfu-red" /> Notification Channels
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive important updates via email</p>
                </div>
              </div>
              <Switch 
                checked={preferences.emailNotifications} 
                onCheckedChange={() => handleToggle("emailNotifications")} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive alerts via text messages</p>
                </div>
              </div>
              <Switch 
                checked={preferences.smsNotifications} 
                onCheckedChange={() => handleToggle("smsNotifications")} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">In-App Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications within the app</p>
                </div>
              </div>
              <Switch 
                checked={preferences.appNotifications} 
                onCheckedChange={() => handleToggle("appNotifications")} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Notification Types</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-gray-500">When you receive new messages</p>
                </div>
              </div>
              <Switch 
                checked={preferences.newMessages} 
                onCheckedChange={() => handleToggle("newMessages")} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Friend Requests</p>
                  <p className="text-sm text-gray-500">When someone sends you a friend request</p>
                </div>
              </div>
              <Switch 
                checked={preferences.friendRequests} 
                onCheckedChange={() => handleToggle("friendRequests")} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Upcoming Events</p>
                  <p className="text-sm text-gray-500">Reminders about events you've joined</p>
                </div>
              </div>
              <Switch 
                checked={preferences.upcomingEvents} 
                onCheckedChange={() => handleToggle("upcomingEvents")} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Marketplace Updates</p>
                  <p className="text-sm text-gray-500">When there are updates to your listings</p>
                </div>
              </div>
              <Switch 
                checked={preferences.marketplaceUpdates} 
                onCheckedChange={() => handleToggle("marketplaceUpdates")} 
              />
            </div>
          </div>
          
          <Button 
            className="w-full mt-6" 
            onClick={handleSavePreferences} 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Notification Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
