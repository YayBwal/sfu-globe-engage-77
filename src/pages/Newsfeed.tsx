import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
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
import { Link, useNavigate } from "react-router-dom";

const Newsfeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
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
        
        // Check for pending requests count if user is logged in
        if (user) {
          const { count, error: countError } = await supabase
            .from('connections')
            .select('id', { count: 'exact', head: true })
            .eq('friend_id', user.id)
            .eq('status', 'pending');
            
          if (!countError && count !== null) {
            setPendingRequestsCount(count);
          }
        }
        
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
  }, [toast, user]);
  
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar */}
            <div className="hidden lg:block">
              <LeftSidebar suggestedUsers={suggestedUsers} />
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Friend requests alert if there are pending requests */}
              {pendingRequestsCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-700">
                      You have {pendingRequestsCount} pending friend request{pendingRequestsCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-blue-300 text-blue-700"
                    onClick={() => navigate('/friends?tab=requests')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> View Requests
                  </Button>
                </div>
              )}
              
              {/* Social connections card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Social</h2>
                  <Link 
                    to="/friends" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/friends?tab=my-friends')}
                  >
                    My Friends
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/friends?tab=discover')}
                  >
                    Find Friends
                  </Button>
                </div>
              </div>
              
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
            </div>
            
            {/* Right sidebar */}
            <div className="hidden lg:block">
              <RightSidebar />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Newsfeed;
