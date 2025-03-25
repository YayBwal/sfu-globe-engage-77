
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

const Newsfeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  
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
            profiles:profiles!user_id(
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
              name: post.profiles?.name || 'Anonymous',
              username: `student_${post.profiles?.student_id || '0000'}`,
              avatar: post.profiles?.profile_pic
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
                profiles:profiles!user_id(
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
              media_type: data.media_type as 'image' | 'video' | 'none',
              view_count: data.view_count,
              created_at: data.created_at,
              updated_at: data.updated_at,
              author: {
                name: data.profiles?.name || 'Anonymous',
                username: `student_${data.profiles?.student_id || '0000'}`,
                avatar: data.profiles?.profile_pic
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar */}
          <LeftSidebar suggestedUsers={suggestedUsers} />
          
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
            <PostsFeed 
              posts={posts}
              isLoading={isLoading}
              activeFilter={activeFilter}
              onPostDeleted={handlePostDeleted}
            />
          </div>
          
          {/* Right sidebar */}
          <RightSidebar />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Newsfeed;
