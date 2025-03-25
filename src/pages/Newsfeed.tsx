import React, { useState, useEffect } from "react";
import { Filter, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { CreatePostForm } from "@/components/newsfeed/CreatePostForm";
import { PostItem, Post } from "@/components/newsfeed/PostItem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Sample trending topics (we'll keep these static for now)
const TRENDING_TOPICS = [
  "#FinalsWeek",
  "#CampusEvents",
  "#StudyTips",
  "#ScholarshipDeadlines",
  "#InternshipOpportunities"
];

const Newsfeed = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  
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
            updated_at,
            profiles:user_id (
              name,
              student_id,
              profile_pic
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (postsError) {
          throw postsError;
        }
        
        // Get reaction counts for each post
        const reactionPromises = postsData.map(post => 
          supabase
            .from('post_reactions')
            .select('reaction_type, count(*)')
            .eq('post_id', post.id)
            .group('reaction_type')
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
            media_type: post.media_type,
            view_count: post.view_count,
            created_at: post.created_at,
            updated_at: post.updated_at,
            author: {
              name: post.profiles.name,
              username: `student_${post.profiles.student_id}`,
              avatar: post.profiles.profile_pic
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
            const { data, error } = await supabase
              .from('posts')
              .select(`
                id,
                user_id,
                content,
                media_url,
                media_type,
                view_count,
                created_at,
                updated_at,
                profiles:user_id (
                  name,
                  student_id,
                  profile_pic
                )
              `)
              .eq('id', payload.new.id)
              .single();
              
            if (error) {
              console.error("Error fetching new post:", error);
              return;
            }
            
            const newPost: Post = {
              id: data.id,
              user_id: data.user_id,
              content: data.content,
              media_url: data.media_url,
              media_type: data.media_type,
              view_count: data.view_count,
              created_at: data.created_at,
              updated_at: data.updated_at,
              author: {
                name: data.profiles.name,
                username: `student_${data.profiles.student_id}`,
                avatar: data.profiles.profile_pic
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
  
  // Filter posts based on active filter
  const filteredPosts = React.useMemo(() => {
    if (activeFilter === "all") {
      return posts;
    } else if (activeFilter === "media") {
      return posts.filter(post => post.media_type && post.media_type !== 'none');
    } else if (activeFilter === "text") {
      return posts.filter(post => !post.media_url || post.media_type === 'none');
    }
    return posts;
  }, [posts, activeFilter]);
  
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar (desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Trending Topics</h3>
              <ul className="space-y-3">
                {TRENDING_TOPICS.map((topic, index) => (
                  <li key={index}>
                    <a href="#" className="text-sfu-red hover:underline text-sm">
                      {topic}
                    </a>
                  </li>
                ))}
              </ul>
              
              <hr className="my-6 border-gray-200" />
              
              <h3 className="font-semibold mb-4">Suggested to Follow</h3>
              <ul className="space-y-4">
                {suggestedUsers.map((suggestedUser, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={suggestedUser.avatar} />
                        <AvatarFallback>
                          {suggestedUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{suggestedUser.name}</p>
                        <p className="text-xs text-gray-500">@{suggestedUser.username}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-2">
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
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading posts...</p>
                </div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <PostItem 
                    key={post.id} 
                    post={post} 
                    onPostDeleted={handlePostDeleted}
                  />
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow p-6">
                  <p className="text-gray-500 mb-3">No posts to display</p>
                  <p className="text-sm text-gray-400">
                    {activeFilter === "all" 
                      ? "Be the first to create a post!" 
                      : "Try a different filter or create a new post."}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right sidebar (desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Upcoming Events</h3>
              
              <div className="space-y-4">
                <div className="border-l-2 border-sfu-red pl-3">
                  <p className="text-xs text-gray-500">Tomorrow, 3:00 PM</p>
                  <p className="font-medium">Graduation Photoshoot</p>
                  <p className="text-sm text-gray-600">Main Campus, Building A</p>
                </div>
                
                <div className="border-l-2 border-blue-500 pl-3">
                  <p className="text-xs text-gray-500">May 15, 9:00 AM</p>
                  <p className="font-medium">Career Fair 2023</p>
                  <p className="text-sm text-gray-600">Student Center</p>
                </div>
                
                <div className="border-l-2 border-green-500 pl-3">
                  <p className="text-xs text-gray-500">May 18, 6:30 PM</p>
                  <p className="font-medium">International Food Festival</p>
                  <p className="text-sm text-gray-600">University Park</p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                View All Events
              </Button>
              
              <hr className="my-6 border-gray-200" />
              
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-700 hover:text-sfu-red">Academic Calendar</a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-sfu-red">Library Resources</a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-sfu-red">Course Catalog</a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-sfu-red">Student Handbook</a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-sfu-red">Campus Map</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Newsfeed;
