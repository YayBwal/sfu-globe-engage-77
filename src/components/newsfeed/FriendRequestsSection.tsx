
import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FriendRequest {
  id: string;
  user_id: string;
  name: string;
  profile_pic?: string;
  student_id: string;
  created_at: string;
}

export const FriendRequestsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch friend requests
  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get pending friend requests
        const { data: connections, error } = await supabase
          .from('connections')
          .select(`
            id,
            user_id,
            created_at
          `)
          .eq('friend_id', user.id)
          .eq('status', 'pending');
          
        if (error) throw error;
        
        if (connections.length === 0) {
          setPendingRequests([]);
          return;
        }
        
        // Get user profiles for each request
        const userIds = connections.map(conn => conn.user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, profile_pic, student_id')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        // Combine connection data with profile data
        const requests = connections.map(conn => {
          const profile = profiles.find(p => p.id === conn.user_id);
          return {
            id: conn.id,
            user_id: conn.user_id,
            name: profile?.name || 'Unknown User',
            profile_pic: profile?.profile_pic,
            student_id: profile?.student_id || '',
            created_at: conn.created_at
          };
        });
        
        setPendingRequests(requests);
        
      } catch (error) {
        console.error('Error fetching friend requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load friend requests',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriendRequests();
    
    // Set up real-time subscription for new requests
    const channel = supabase
      .channel('friend_requests')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'connections', filter: `friend_id=eq.${user?.id}` }, 
        (payload) => {
          if (payload.new.status === 'pending') {
            fetchFriendRequests();
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Handle request response (accept/decline)
  const handleRequestResponse = async (connectionId: string, userId: string, accept: boolean) => {
    try {
      if (accept) {
        // Accept request - update status to accepted
        const { error } = await supabase
          .from('connections')
          .update({ status: 'accepted' })
          .eq('id', connectionId);
          
        if (error) throw error;
        
        // Create reciprocal connection
        const { error: reciprocalError } = await supabase
          .from('connections')
          .insert({
            user_id: user!.id,
            friend_id: userId,
            status: 'accepted'
          });
          
        if (reciprocalError) throw reciprocalError;
        
        toast({
          title: 'Friend Request Accepted',
          description: 'You are now connected!'
        });
      } else {
        // Decline request - delete the connection
        const { error } = await supabase
          .from('connections')
          .delete()
          .eq('id', connectionId);
          
        if (error) throw error;
        
        toast({
          title: 'Friend Request Declined',
          description: 'The request has been declined'
        });
      }
      
      // Remove from local state
      setPendingRequests(prev => 
        prev.filter(request => request.id !== connectionId)
      );
      
    } catch (error) {
      console.error('Error responding to friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process the request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // If user is not logged in or there's no requests, don't show anything
  if (!user || (!isLoading && pendingRequests.length === 0)) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Friend Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-2">
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={request.profile_pic} />
                    <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-gray-500">ID: {request.student_id}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleRequestResponse(request.id, request.user_id, true)}
                  >
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => handleRequestResponse(request.id, request.user_id, false)}
                  >
                    <X className="h-4 w-4 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-gray-500">No pending friend requests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
