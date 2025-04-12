
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/settings/ProfileSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySettings from "@/components/settings/PrivacySettings";
import ThemeSettings from "@/components/settings/ThemeSettings";
import AccountDangerZone from "@/components/settings/AccountDangerZone";

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="p-4 max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 w-full bg-transparent p-1 rounded-lg">
          <TabsTrigger 
            value="profile" 
            className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black rounded-md transition-all duration-300"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black rounded-md transition-all duration-300"
          >
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black rounded-md transition-all duration-300"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="privacy" 
            className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black rounded-md transition-all duration-300"
          >
            Privacy
          </TabsTrigger>
          <TabsTrigger 
            value="appearance" 
            className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black rounded-md transition-all duration-300"
          >
            Appearance
          </TabsTrigger>
          <TabsTrigger 
            value="danger" 
            className="text-xs md:text-sm text-red-500 data-[state=active]:bg-red-50 data-[state=active]:text-red-600 rounded-md transition-all duration-300"
          >
            Danger Zone
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-2">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="security" className="mt-2">
          <SecuritySettings />
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-2">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="privacy" className="mt-2">
          <PrivacySettings />
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-2">
          <ThemeSettings />
        </TabsContent>
        
        <TabsContent value="danger" className="mt-2">
          <AccountDangerZone />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
