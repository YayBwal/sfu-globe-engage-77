
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    name: string;
    profile_pic?: string;
  };
}

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  onCommentAdded,
  onCommentDeleted
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch comments for this post
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        
        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('post_comments')
          .select(`
            id,
            user_id,
            content,
            created_at
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        
        if (commentsError) {
          throw commentsError;
        }
        
        if (!commentsData || commentsData.length === 0) {
          setComments([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch user profiles separately
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, profile_pic')
          .in('id', userIds);
          
        if (profilesError) {
          throw profilesError;
        }
        
        // Create a profiles lookup
        const profilesLookup: Record<string, any> = {};
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesLookup[profile.id] = profile;
          });
        }
        
        // Add user data to comments
        const formattedComments = commentsData.map(comment => {
          const profile = profilesLookup[comment.user_id];
          return {
            ...comment,
            user: profile ? {
              name: profile.name,
              profile_pic: profile.profile_pic
            } : undefined
          };
        });
        
        setComments(formattedComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast({
          title: "Error",
          description: "Failed to load comments. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up realtime subscription for new comments
    const channel = supabase
      .channel('public:post_comments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const fetchComment = async () => {
              try {
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('name, profile_pic')
                  .eq('id', payload.new.user_id)
                  .maybeSingle();
                  
                if (profileError && profileError.code !== 'PGRST116') {
                  console.error("Error fetching user for comment:", profileError);
                  return;
                }
                
                const newComment = {
                  id: payload.new.id,
                  user_id: payload.new.user_id,
                  content: payload.new.content,
                  created_at: payload.new.created_at,
                  user: profileData ? {
                    name: profileData.name,
                    profile_pic: profileData.profile_pic
                  } : {
                    name: 'Anonymous',
                    profile_pic: undefined
                  }
                };
                
                setComments(prev => [...prev, newComment]);
              } catch (error) {
                console.error("Error handling new comment:", error);
              }
            };
            
            fetchComment();
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(comment => comment.id !== payload.old.id));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };

    fetchComments();
  }, [postId, toast]);

  // Function to add a new comment
  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on posts",
        variant: "destructive"
      });
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });
        
      if (error) {
        throw error;
      }
      
      setNewComment('');
      onCommentAdded();
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to delete a comment
  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!user) return;
    
    // Only allow users to delete their own comments
    if (user.id !== commentUserId) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own comments",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);
        
      if (error) {
        throw error;
      }
      
      setComments(comments.filter(comment => comment.id !== commentId));
      onCommentDeleted();
      
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    
    <div className="border-t p-4">
      {/* Comment input */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="mt-1">
          <AvatarImage src={profile?.profile_pic} />
          <AvatarFallback>{profile ? profile.name.charAt(0) : 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] mb-2"
          />
          <Button 
            onClick={handleAddComment}
            disabled={!newComment.trim() || isSubmitting}
            className="bg-sfu-red hover:bg-sfu-red/90 text-white"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>
      
      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center my-4">
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user?.profile_pic} />
                <AvatarFallback>
                  {comment.user ? comment.user.name.charAt(0) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">
                      {comment.user?.name || 'Anonymous'}
                    </p>
                    {user && user.id === comment.user_id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                        onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-2">
                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};
