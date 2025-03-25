
import React, { useState, useEffect } from 'react';
import { User, UserPlus, UserCheck, UserX, MessageSquare } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback 
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileViewProps {
  userId: string;
  onClose?: () => void;
}

export const UserProfileView = ({ userId, onClose }: UserProfileViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'friend'>('none');
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError) throw profileError;
        
        setProfileData(profile);
        
        // Check connection status if viewing as logged-in user
        if (user && user.id !== userId) {
          // Check if we've sent a request
          const { data: outgoingConn, error: outError } = await supabase
            .from('connections')
            .select('status')
            .eq('user_id', user.id)
            .eq('friend_id', userId)
            .maybeSingle();
            
          if (outgoingConn) {
            setConnectionStatus(outgoingConn.status === 'accepted' ? 'friend' : 'pending');
            return;
          }
          
          // Check if we've received a request
          const { data: incomingConn, error: inError } = await supabase
            .from('connections')
            .select('status')
            .eq('user_id', userId)
            .eq('friend_id', user.id)
            .maybeSingle();
            
          if (incomingConn) {
            setConnectionStatus(incomingConn.status === 'accepted' ? 'friend' : 'pending');
            return;
          }
          
          setConnectionStatus('none');
        }
        
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user profile',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
    
    // Set up real-time subscription for online status changes
    const onlineStatusChannel = supabase
      .channel(`profile_online_status_${userId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.new.online !== undefined) {
            setProfileData(current => ({
              ...current,
              online: payload.new.online
            }));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(onlineStatusChannel);
    };
  }, [userId, user, toast]);

  const handleSendFriendRequest = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to send friend requests',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Insert connection record
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          friend_id: userId,
          status: 'pending'
        });
        
      if (error) throw error;
      
      setConnectionStatus('pending');
      
      toast({
        title: 'Friend Request Sent',
        description: 'Your friend request has been sent'
      });
      
      // Send notification to the user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'New Friend Request',
          message: `You have received a friend request`,
          source: 'friend',
          type: 'info'
        });
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Request Error',
        description: 'Failed to send friend request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCancelRequest = async () => {
    if (!user) return;
    
    try {
      // Delete the pending connection
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', userId);
        
      if (error) throw error;
      
      setConnectionStatus('none');
      
      toast({
        title: 'Request Cancelled',
        description: 'Your friend request has been cancelled'
      });
      
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel friend request',
        variant: 'destructive'
      });
    }
  };

  const handleUnfriend = async () => {
    if (!user) return;
    
    try {
      // Delete both connections
      const { error: error1 } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', userId);
        
      const { error: error2 } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', user.id);
        
      if (error1 || error2) throw error1 || error2;
      
      setConnectionStatus('none');
      
      toast({
        title: 'Friend Removed',
        description: 'You are no longer friends with this user'
      });
      
    } catch (error) {
      console.error('Error unfriending:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove friend',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profileData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-muted-foreground">User not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">User Profile</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={profileData.profile_pic} />
              <AvatarFallback className="text-lg">
                {profileData.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {profileData.online && (
              <span className="absolute right-0 bottom-4 h-4 w-4 rounded-full bg-green-500 border-2 border-white" title="Online"></span>
            )}
            {!profileData.online && (
              <span className="absolute right-0 bottom-4 h-4 w-4 rounded-full bg-gray-400 border-2 border-white" title="Offline"></span>
            )}
          </div>
          
          <h2 className="text-xl font-semibold mb-1">{profileData.name}</h2>
          <p className="text-muted-foreground mb-1">Student ID: {profileData.student_id}</p>
          <p className="text-sm text-gray-500 mb-4">
            {profileData.online ? 'Online' : 'Offline'}
          </p>
          
          {/* Connection actions - only show if viewing as a different user */}
          {user && user.id !== userId && (
            <div className="flex space-x-2 mb-4">
              {connectionStatus === 'none' && (
                <Button 
                  onClick={handleSendFriendRequest}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Add Friend
                </Button>
              )}
              
              {connectionStatus === 'pending' && (
                <Button 
                  variant="outline" 
                  onClick={handleCancelRequest}
                >
                  <UserX className="h-4 w-4 mr-2" /> Cancel Request
                </Button>
              )}
              
              {connectionStatus === 'friend' && (
                <>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" /> Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={handleUnfriend}
                  >
                    <UserX className="h-4 w-4 mr-2" /> Unfriend
                  </Button>
                </>
              )}
            </div>
          )}
          
          <Separator className="my-4" />
          
          {/* Profile details */}
          <div className="w-full space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Major</h3>
              <p>{profileData.major || 'Not specified'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Batch</h3>
              <p>{profileData.batch || 'Not specified'}</p>
            </div>
            
            {profileData.bio && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                <p>{profileData.bio}</p>
              </div>
            )}
            
            {profileData.interests?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.map((interest: string, index: number) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
