
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserCog, Image as ImageIcon } from "lucide-react";
import AccountSettings from "@/components/settings/AccountSettings";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("account");

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-sfu-red dark:text-blue-400" />
          <span className="ml-2 text-lg dark:text-gray-200">Loading profile...</span>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-4">
          <h2 className="text-2xl font-bold mb-2 dark:text-gray-100">Authentication Required</h2>
          <p className="text-gray-600 mb-6 dark:text-gray-400">Please log in to view and manage your profile</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Profile Header with Cover Photo and Avatar */}
        <ProfileHeader profile={profile} />
        
        {/* Main Content Area */}
        <div className="mt-6">
          <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900/95">
            <CardContent className="p-0">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full border-b rounded-none justify-start bg-gray-50 dark:bg-gray-900/80 dark:border-gray-800 p-0">
                  <TabsTrigger 
                    value="account" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-b-none border-b-2 data-[state=active]:border-b-sfu-red dark:data-[state=active]:border-b-blue-500 data-[state=active]:shadow-none py-3"
                  >
                    <UserCog className="mr-2 h-4 w-4 dark:text-gray-300" />
                    <span className="dark:text-gray-200">Account Settings</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="account" className="p-0 border-none">
                  <AccountSettings />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
