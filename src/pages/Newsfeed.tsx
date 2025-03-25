import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { CreatePostForm } from "@/components/newsfeed/CreatePostForm";
import { PostsFeed } from "@/components/newsfeed/PostsFeed";
import { LeftSidebar } from "@/components/newsfeed/LeftSidebar";
import { RightSidebar } from "@/components/newsfeed/RightSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Post } from "@/components/newsfeed/PostItem";
import { FriendRequestsSection } from "@/components/newsfeed/FriendRequestsSection";
import { FriendsListSection } from "@/components/newsfeed/FriendsListSection";
import { FriendSuggestionsSection } from "@/components/newsfeed/FriendSuggestionsSection";
import { FindFriendSection } from "@/components/newsfeed/FindFriendSection";

const Newsfeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  
  // Fetch posts and related data
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        
        // Fetch posts with author information
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            user_id,
            content,
            media_url,
            media_type,
            view_count,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (postsError) {
          throw postsError;
        }
        
        // Get author profiles for posts
        const userIds = [...new Set(postsData.map(post => post.user_id))];
        
        // Fetch profiles separately
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, student_id, profile_pic')
          .in('id', userIds);
        
        if (profilesError) {
          throw profilesError;
        }
        
        // Create a profiles lookup object
        const profilesLookup: Record<string, any> = {};
        profilesData.forEach(profile => {
          profilesLookup[profile.id] = profile;
        });
        
        // Get reaction counts for each post
        const reactionPromises = postsData.map(post => 
          supabase
            .from('post_reactions')
            .select('reaction_type, count')
            .eq('post_id', post.id)
            .select('reaction_type, count')
        );
        
        // Get comment counts
        const commentPromises = postsData.map(post => 
          supabase
            .from('post_comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)
        );
        
        // Get share counts
        const sharePromises = postsData.map(post => 
          supabase
            .from('post_shares')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)
        );
        
        // Process all promises
        const [reactionResults, commentResults, shareResults] = await Promise.all([
          Promise.all(reactionPromises),
          Promise.all(commentPromises),
          Promise.all(sharePromises)
        ]);
        
        // Format the post data
        const formattedPosts = postsData.map((post, index) => {
          // Get the profile for this post
          const profile = profilesLookup[post.user_id];
          
          // Process reactions
          const reactions: any = { like: 0, sad: 0, haha: 0, wow: 0, angry: 0, smile: 0 };
          if (reactionResults[index].data) {
            reactionResults[index].data.forEach((item: any) => {
              reactions[item.reaction_type] = parseInt(item.count);
            });
          }
          
          return {
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            media_url: post.media_url,
            media_type: post.media_type as 'image' | 'video' | 'none' | string,
            view_count: post.view_count,
            created_at: post.created_at,
            updated_at: post.updated_at,
            author: {
              name: profile?.name || 'Anonymous',
              username: `student_${profile?.student_id || '0000'}`,
              avatar: profile?.profile_pic
            },
            reactions,
            _count: {
              comments: commentResults[index].count || 0,
              shares: shareResults[index].count || 0
            }
          };
        });
        
        setPosts(formattedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast({
          title: "Error loading feed",
          description: "Failed to load posts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
    
    // Set up real-time subscription for new posts
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' }, 
        (payload) => {
          // When a new post is created, fetch it with complete information
          const fetchNewPost = async () => {
            const { data: postData, error: postError } = await supabase
              .from('posts')
              .select(`
                id,
                user_id,
                content,
                media_url,
                media_type,
                view_count,
                created_at,
                updated_at
              `)
              .eq('id', payload.new.id)
              .single();
              
            if (postError) {
              console.error("Error fetching new post:", postError);
              return;
            }
            
            // Get author profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('name, student_id, profile_pic')
              .eq('id', postData.user_id)
              .single();
            
            if (profileError) {
              console.error("Error fetching profile for new post:", profileError);
              return;
            }
            
            const newPost: Post = {
              id: postData.id,
              user_id: postData.user_id,
              content: postData.content,
              media_url: postData.media_url,
              media_type: postData.media_type as 'image' | 'video' | 'none',
              view_count: postData.view_count,
              created_at: postData.created_at,
              updated_at: postData.updated_at,
              author: {
                name: profileData?.name || 'Anonymous',
                username: `student_${profileData?.student_id || '0000'}`,
                avatar: profileData?.profile_pic
              },
              reactions: { like: 0, sad: 0, haha: 0, wow: 0, angry: 0, smile: 0 },
              _count: { comments: 0, shares: 0 }
            };
            
            setPosts(prev => [newPost, ...prev]);
          };
          
          fetchNewPost();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
  
  // Fetch suggested users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user) return;
      
      try {
        // Get a random selection of users as suggestions 
        // In a real app, you'd want to suggest users based on common interests, etc.
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, profile_pic')
          .neq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (error) {
          throw error;
        }
        
        setSuggestedUsers(data.map(user => ({
          name: user.name,
          username: `user_${user.id.substring(0, 8)}`,
          avatar: user.profile_pic
        })));
        
      } catch (error) {
        console.error("Error fetching suggested users:", error);
      }
    };
    
    fetchSuggestedUsers();
  }, [user]);
  
  // Handle post created
  const handlePostCreated = () => {
    // We rely on the real-time subscription to update the posts list
    toast({
      title: "Success",
      description: "Your post has been published"
    });
  };
  
  // Handle post deleted
  const handlePostDeleted = () => {
    // We could potentially refetch all posts, but for simplicity, we'll just reload the page
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar */}
            <div className="hidden lg:block">
              <LeftSidebar suggestedUsers={suggestedUsers} />
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2">
              <TabsContent value="feed" className="mt-0">
                {/* Friend requests section - only on feed tab */}
                <FriendRequestsSection />
                
                {/* Post creation card */}
                <CreatePostForm onPostCreated={handlePostCreated} />
                
                {/* Filters */}
                <div className="mb-6">
                  <Tabs defaultValue={activeFilter} onValueChange={setActiveFilter}>
                    <TabsList className="w-full bg-white">
                      <TabsTrigger value="all" className="flex-1">All Posts</TabsTrigger>
                      <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                      <TabsTrigger value="text" className="flex-1">Text Only</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {/* Feed posts */}
                <PostsFeed 
                  posts={posts}
                  isLoading={isLoading}
                  activeFilter={activeFilter}
                  onPostDeleted={handlePostDeleted}
                />
              </TabsContent>
              
              <TabsContent value="friends" className="mt-0 space-y-6">
                {/* Friend management sections */}
                <FriendRequestsSection />
                <FriendsListSection />
              </TabsContent>
              
              <TabsContent value="discover" className="mt-0 space-y-6">
                {/* Friend discovery sections */}
                <FindFriendSection />
                <FriendSuggestionsSection />
              </TabsContent>
            </div>
            
            {/* Right sidebar */}
            <div className="hidden lg:block">
              <RightSidebar />
            </div>
            
            {/* Mobile bottom tabs */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around">
              <button 
                className={`p-2 rounded-full ${activeTab === 'feed' ? 'bg-gray-100' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                Feed
              </button>
              <button 
                className={`p-2 rounded-full ${activeTab === 'friends' ? 'bg-gray-100' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                Friends
              </button>
              <button 
                className={`p-2 rounded-full ${activeTab === 'discover' ? 'bg-gray-100' : ''}`}
                onClick={() => setActiveTab('discover')}
              >
                Discover
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Newsfeed;
