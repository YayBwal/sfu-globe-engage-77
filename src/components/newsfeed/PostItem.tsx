
import React, { useState, useRef, useEffect } from 'react';
import { 
  ThumbsUp, MessageSquare, Share2, MoreHorizontal, Trash2, 
  Copy, Bookmark, UserPlus, PlayCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ReactionPicker } from "./ReactionPicker";
import { CommentSection } from "./CommentSection";
import { ShareOptions } from "./ShareOptions";
import { supabase } from "@/integrations/supabase/client";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'none' | string;
  view_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    name: string;
    username?: string;
    avatar?: string;
  };
  reactions?: {
    like: number;
    sad: number;
    haha: number;
    wow: number;
    angry: number;
    smile: number;
  };
  _count?: {
    comments: number;
    shares: number;
  };
  comments?: any[];
}

interface PostItemProps {
  post: Post;
  onPostDeleted?: () => void;
}

export const PostItem: React.FC<PostItemProps> = ({ post, onPostDeleted }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactionsCount, setReactionsCount] = useState({
    like: post.reactions?.like || 0,
    sad: post.reactions?.sad || 0, 
    haha: post.reactions?.haha || 0,
    wow: post.reactions?.wow || 0,
    angry: post.reactions?.angry || 0,
    smile: post.reactions?.smile || 0
  });
  const [commentsCount, setCommentsCount] = useState(post._count?.comments || 0);
  const [sharesCount, setSharesCount] = useState(post._count?.shares || 0);
  const [videoViews, setVideoViews] = useState(post.view_count || 0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Check if current user has reacted to this post
  useEffect(() => {
    const checkUserReaction = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('post_reactions')
          .select('reaction_type')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error checking reaction:", error);
          return;
        }
        
        if (data) {
          setUserReaction(data.reaction_type);
        }
      } catch (error) {
        console.error("Error checking user reaction:", error);
      }
    };
    
    checkUserReaction();
  }, [post.id, user]);
  
  // Function to handle video view increment
  const handleVideoView = async () => {
    if (post.media_type !== 'video') return;
    
    try {
      // Increment view count locally for immediate feedback
      setVideoViews(prev => prev + 1);
      
      // Update view count in database
      await supabase
        .from('posts')
        .update({ view_count: videoViews + 1 })
        .eq('id', post.id);
        
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  };
  
  // Function to fetch reaction counts - FIXED SQL query
  const fetchReactionCounts = async () => {
    try {
      // First fetch all reactions for this post
      const { data, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', post.id);
      
      if (error) {
        console.error("Error fetching reactions:", error);
        return;
      }
      
      // Count reactions by type manually
      const newReactions = { 
        like: 0, sad: 0, haha: 0, wow: 0, angry: 0, smile: 0 
      };
      
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          if (item.reaction_type in newReactions) {
            newReactions[item.reaction_type as keyof typeof newReactions] += 1;
          }
        });
      }
      
      setReactionsCount(newReactions);
    } catch (error) {
      console.error("Error fetching reaction counts:", error);
    }
  };
  
  // Fetch reaction counts when the component mounts
  useEffect(() => {
    fetchReactionCounts();
  }, [post.id]);
  
  // Function to handle reactions
  const handleReaction = async (reaction: string) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please log in to react to posts",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (userReaction === reaction) {
        // Remove the reaction if clicking the same one
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
          
        setUserReaction(null);
        setReactionsCount(prev => ({
          ...prev,
          [reaction]: Math.max(0, prev[reaction as keyof typeof prev] - 1)
        }));
      } else {
        // If there was a previous reaction, remove it first
        if (userReaction) {
          setReactionsCount(prev => ({
            ...prev,
            [userReaction]: Math.max(0, prev[userReaction as keyof typeof prev] - 1)
          }));
        }
        
        // Add the new reaction
        await supabase
          .from('post_reactions')
          .upsert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: reaction
          }, { onConflict: 'post_id,user_id' });
          
        setUserReaction(reaction);
        setReactionsCount(prev => ({
          ...prev,
          [reaction]: prev[reaction as keyof typeof prev] + 1
        }));
      }
      
      // Refetch reaction counts to ensure accuracy
      fetchReactionCounts();
      
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast({ 
        title: "Error",
        description: "Failed to save your reaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsReactionPickerOpen(false);
    }
  };
  
  const handleDeletePost = async () => {
    if (!user || user.id !== post.user_id) {
      toast({ 
        title: "Permission denied", 
        description: "You can only delete your own posts",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
        
      toast({ 
        title: "Post deleted", 
        description: "Your post has been removed"
      });
      
      if (onPostDeleted) {
        onPostDeleted();
      }
      
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ 
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to copy post link
  const handleCopyLink = () => {
    const postLink = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postLink);
    toast({ 
      title: "Link copied", 
      description: "Post link copied to clipboard"
    });
    setIsShareMenuOpen(false);
  };
  
  // Function to save post
  const handleSavePost = async () => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please log in to save posts",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await supabase
        .from('post_shares')
        .insert({
          post_id: post.id,
          user_id: user.id,
          share_type: 'save',
        });
        
      toast({ 
        title: "Post saved", 
        description: "Post saved to your bookmarks"
      });
      setIsShareMenuOpen(false);
      setSharesCount(prev => prev + 1);
      
    } catch (error) {
      console.error("Error saving post:", error);
      toast({ 
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to share post with a friend
  const handleShareWithFriend = async (friendId: string) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please log in to share posts",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await supabase
        .from('post_shares')
        .insert({
          post_id: post.id,
          user_id: user.id,
          share_type: 'friend',
          receiver_id: friendId
        });
        
      toast({ 
        title: "Post shared", 
        description: "Post has been shared with your friend"
      });
      setIsShareMenuOpen(false);
      setSharesCount(prev => prev + 1);
      
    } catch (error) {
      console.error("Error sharing post:", error);
      toast({ 
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Calculate total reactions
  const totalReactions = Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);
  
  // Get the dominant reaction type
  const getDominantReaction = () => {
    if (totalReactions === 0) return null;
    
    let maxCount = 0;
    let dominantType = null;
    
    for (const [type, count] of Object.entries(reactionsCount)) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    }
    
    return dominantType;
  };
  
  // Get emoji for reaction type
  const getReactionEmoji = (type: string | null) => {
    switch (type) {
      case 'like': return '👍';
      case 'sad': return '😢';
      case 'haha': return '😂';
      case 'wow': return '😮';
      case 'angry': return '😡';
      case 'smile': return '🙂';
      default: return '👍';
    }
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        {/* Post header */}
        <div className="p-4 flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarImage src={post.author?.avatar} />
              <AvatarFallback>
                {post.author?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author?.name || 'Anonymous'}</p>
              <div className="flex items-center text-xs text-gray-500">
                <span>{post.author?.username && `@${post.author.username}`}</span>
                <span className="mx-1">•</span>
                <span>{format(new Date(post.created_at), 'MMM d, h:mm a')}</span>
              </div>
            </div>
          </div>
          
          {/* Post options menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {user && user.id === post.user_id && (
                <>
                  <DropdownMenuItem 
                    className="text-red-500 cursor-pointer flex items-center"
                    onClick={handleDeletePost}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                className="cursor-pointer flex items-center"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center"
                onClick={handleSavePost}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Save post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Post content */}
        <div className="px-4 pb-3">
          <p className="whitespace-pre-line">{post.content}</p>
        </div>
        
        {/* Post media */}
        {post.media_url && post.media_type === 'image' && (
          <div className="w-full">
            <img 
              src={post.media_url} 
              alt="Post image" 
              className="w-full h-auto object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
                console.error("Failed to load image:", post.media_url);
              }}
            />
          </div>
        )}
        
        {post.media_url && post.media_type === 'video' && (
          <div className="w-full relative">
            <video 
              ref={videoRef}
              src={post.media_url} 
              controls
              className="w-full h-auto"
              onPlay={handleVideoView}
              onError={(e) => {
                console.error("Failed to load video:", post.media_url);
              }}
            />
            {videoViews > 0 && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
                <PlayCircle className="h-3 w-3 mr-1" />
                {videoViews} {videoViews === 1 ? 'view' : 'views'}
              </div>
            )}
          </div>
        )}
        
        {/* Post stats */}
        <div className="px-4 py-2 border-t border-b flex justify-between text-xs text-gray-500">
          {totalReactions > 0 ? (
            <div className="flex items-center">
              <span className="mr-1">{getReactionEmoji(getDominantReaction())}</span>
              <span>{totalReactions}</span>
            </div>
          ) : (
            <span>Be the first to react</span>
          )}
          <div>
            {commentsCount > 0 && (
              <span className="cursor-pointer" onClick={() => setShowComments(!showComments)}>
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </span>
            )}
            {commentsCount > 0 && sharesCount > 0 && <span className="mx-1">•</span>}
            {sharesCount > 0 && (
              <span>{sharesCount} {sharesCount === 1 ? 'share' : 'shares'}</span>
            )}
          </div>
        </div>
        
        {/* Post actions */}
        <div className="grid grid-cols-3 divide-x">
          <div className="relative">
            <Button 
              variant="ghost" 
              className={`rounded-none py-2 h-auto w-full ${userReaction ? 'text-blue-500 font-medium' : ''}`}
              onClick={() => userReaction ? handleReaction(userReaction) : setIsReactionPickerOpen(!isReactionPickerOpen)}
            >
              <ThumbsUp className={`h-4 w-4 mr-2 ${userReaction ? 'fill-current' : ''}`} />
              {userReaction ? getReactionEmoji(userReaction) : 'Like'}
            </Button>
            
            {isReactionPickerOpen && (
              <ReactionPicker onReact={handleReaction} onClose={() => setIsReactionPickerOpen(false)} />
            )}
          </div>
          
          <Button 
            variant="ghost" 
            className="rounded-none py-2 h-auto"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Comment
          </Button>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              className="rounded-none py-2 h-auto w-full"
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            {isShareMenuOpen && (
              <ShareOptions 
                onCopyLink={handleCopyLink} 
                onSavePost={handleSavePost}
                onShareWithFriend={handleShareWithFriend}
                onClose={() => setIsShareMenuOpen(false)}
              />
            )}
          </div>
        </div>
        
        {/* Comments section */}
        {showComments && (
          <CommentSection 
            postId={post.id} 
            onCommentAdded={() => setCommentsCount(prev => prev + 1)}
            onCommentDeleted={() => setCommentsCount(prev => Math.max(0, prev - 1))}
          />
        )}
      </CardContent>
    </Card>
  );
};
