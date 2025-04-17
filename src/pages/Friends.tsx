
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import FindFriendSection from "@/components/newsfeed/FindFriendSection";
import { FriendRequestsSection } from "@/components/newsfeed/FriendRequestsSection";
import { FriendsListSection } from "@/components/newsfeed/FriendsListSection";
import { FriendSuggestionsSection } from "@/components/newsfeed/FriendSuggestionsSection";
import { MessagesSection } from "@/components/newsfeed/MessagesSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

const Friends = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-friends");

  return (
    <Layout>
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 dark:text-gray-100">Friends</h1>
          
          <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900/95 overflow-hidden">
            <CardContent className="p-0">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full border-b rounded-none justify-start bg-gray-50 dark:bg-gray-900/80 dark:border-gray-800 p-0">
                  <TabsTrigger 
                    value="my-friends" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-b-none border-b-2 data-[state=active]:border-b-sfu-red dark:data-[state=active]:border-b-blue-500 data-[state=active]:shadow-none py-3"
                  >
                    <span className="dark:text-gray-200">My Friends</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="messages" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-b-none border-b-2 data-[state=active]:border-b-sfu-red dark:data-[state=active]:border-b-blue-500 data-[state=active]:shadow-none py-3"
                  >
                    <span className="dark:text-gray-200">Messages</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="requests" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-b-none border-b-2 data-[state=active]:border-b-sfu-red dark:data-[state=active]:border-b-blue-500 data-[state=active]:shadow-none py-3"
                  >
                    <span className="dark:text-gray-200">Requests</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="discover" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-b-none border-b-2 data-[state=active]:border-b-sfu-red dark:data-[state=active]:border-b-blue-500 data-[state=active]:shadow-none py-3"
                  >
                    <span className="dark:text-gray-200">Discover</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="p-4 dark:bg-gray-900">
                  <TabsContent value="my-friends" className="m-0">
                    <FriendsListSection />
                  </TabsContent>
                  
                  <TabsContent value="messages" className="m-0">
                    <MessagesSection />
                  </TabsContent>
                  
                  <TabsContent value="requests" className="m-0">
                    <FriendRequestsSection />
                  </TabsContent>
                  
                  <TabsContent value="discover" className="m-0">
                    <div className="space-y-6">
                      <FindFriendSection />
                      <FriendSuggestionsSection />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </Layout>
  );
};

export default Friends;
