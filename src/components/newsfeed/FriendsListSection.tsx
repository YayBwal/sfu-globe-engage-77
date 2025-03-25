
import React, { useState, useEffect } from 'react';
import { MessageSquare, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Friend {
  id: string;
  name: string;
  profile_pic?: string;
  student_id: string;
  connection_id: string;
  online: boolean;
}

export const FriendsListSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch friends list
  useEffect(() => {
    const fetchFriendsList = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get accepted connections
        const { data: connections, error } = await supabase
          .from('connections')
          .select('id, friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');
          
        if (error) throw error;
        
        if (connections.length === 0) {
          setFriends([]);
          return;
        }
        
        // Get friend profiles
        const friendIds = connections.map(conn => conn.friend_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, profile_pic, student_id, online')
          .in('id', friendIds);
          
        if (profilesError) throw profilesError;
        
        // Combine connection data with profile data
        const friendsList = profiles.map(profile => {
          const connection = connections.find(c => c.friend_id === profile.id);
          return {
            id: profile.id,
            name: profile.name,
            profile_pic: profile.profile_pic,
            student_id: profile.student_id,
            connection_id: connection?.id || '',
            online: profile.online || false
          };
        });
        
        setFriends(friendsList);
        
      } catch (error) {
        console.error('Error fetching friends list:', error);
        toast({
          title: 'Error',
          description: 'Failed to load friends list',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriendsList();
    
    // Set up real-time subscription for connection changes
    const connectionChannel = supabase
      .channel('friends_list_connections')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'connections', filter: `user_id=eq.${user?.id}` }, 
        () => {
          fetchFriendsList();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for online status changes
    const onlineStatusChannel = supabase
      .channel('friends_online_status')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `online=eq.true` },
        (payload) => {
          setFriends(currentFriends => 
            currentFriends.map(friend => 
              friend.id === payload.new.id 
                ? { ...friend, online: payload.new.online } 
                : friend
            )
          );
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `online=eq.false` },
        (payload) => {
          setFriends(currentFriends => 
            currentFriends.map(friend => 
              friend.id === payload.new.id 
                ? { ...friend, online: payload.new.online } 
                : friend
            )
          );
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(connectionChannel);
      supabase.removeChannel(onlineStatusChannel);
    };
  }, [user, toast]);

  // Handle unfriend
  const handleUnfriend = async (connectionId: string, friendId: string) => {
    try {
      // Delete the connection from both sides
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);
        
      if (error) throw error;
      
      // Delete the reciprocal connection
      const { error: reciprocalError } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user!.id);
        
      if (reciprocalError) throw reciprocalError;
      
      // Update local state
      setFriends(prev => 
        prev.filter(friend => friend.connection_id !== connectionId)
      );
      
      toast({
        title: 'Friend Removed',
        description: 'The friend has been removed from your list'
      });
      
    } catch (error) {
      console.error('Error unfriending:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove friend. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // If user is not logged in, don't show anything
  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Friends</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-2">
            <p className="text-gray-500">Loading friends...</p>
          </div>
        ) : friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={friend.profile_pic} />
                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {friend.online && (
                      <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" 
                        title="Online"></span>
                    )}
                    {!friend.online && (
                      <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-gray-400 border-2 border-white" 
                        title="Offline"></span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{friend.name}</p>
                    <p className="text-xs text-gray-500">
                      {friend.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-gray-600 h-8 w-8 p-0"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-red-500 h-8 w-8 p-0"
                    onClick={() => handleUnfriend(friend.connection_id, friend.id)}
                    title="Unfriend"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-gray-500">You don't have any friends yet</p>
            <p className="text-sm text-gray-400 mt-1">Use the Find Friends feature to connect with others</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
