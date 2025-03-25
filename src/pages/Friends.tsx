
import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FindFriendSection } from "@/components/newsfeed/FindFriendSection";
import { FriendRequestsSection } from "@/components/newsfeed/FriendRequestsSection";
import { FriendsListSection } from "@/components/newsfeed/FriendsListSection";
import { FriendSuggestionsSection } from "@/components/newsfeed/FriendSuggestionsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

const Friends = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-friends");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Friends</h1>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="my-friends">My Friends</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="space-y-6">
            <TabsContent value="my-friends" className="mt-0">
              <FriendsListSection />
            </TabsContent>
            
            <TabsContent value="requests" className="mt-0">
              <FriendRequestsSection />
            </TabsContent>
            
            <TabsContent value="discover" className="mt-0 space-y-6">
              <FindFriendSection />
              <FriendSuggestionsSection />
            </TabsContent>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Friends;
