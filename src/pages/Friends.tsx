
import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FindFriendSection from "@/components/newsfeed/FindFriendSection";
import { FriendRequestsSection } from "@/components/newsfeed/FriendRequestsSection";
import { FriendsListSection } from "@/components/newsfeed/FriendsListSection";
import { FriendSuggestionsSection } from "@/components/newsfeed/FriendSuggestionsSection";
import { MessagesSection } from "@/components/newsfeed/MessagesSection";
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
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
              <TabsTrigger value="my-friends">My Friends</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
            
            <div className="space-y-6 mt-6">
              <TabsContent value="my-friends">
                <FriendsListSection />
              </TabsContent>
              
              <TabsContent value="messages">
                <MessagesSection />
              </TabsContent>
              
              <TabsContent value="requests">
                <FriendRequestsSection />
              </TabsContent>
              
              <TabsContent value="discover">
                <div className="space-y-6">
                  <FindFriendSection />
                  <FriendSuggestionsSection />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Friends;
