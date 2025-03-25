
import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SuggestedFriend {
  id: string;
  name: string;
  profile_pic?: string;
  student_id: string;
}

export const FriendSuggestionsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});

  // Fetch friend suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get existing connections (both pending and accepted)
        const { data: existingConnections, error: connectionsError } = await supabase
          .from('connections')
          .select('friend_id, status')
          .eq('user_id', user.id);
          
        if (connectionsError) throw connectionsError;
        
        // Create a lookup of existing connections
        const existingConnLookup: Record<string, string> = {};
        const pendingLookup: Record<string, boolean> = {};
        
        existingConnections.forEach(conn => {
          existingConnLookup[conn.friend_id] = conn.status;
          if (conn.status === 'pending') {
            pendingLookup[conn.friend_id] = true;
          }
        });
        
        setPendingRequests(pendingLookup);
        
        // Get profiles for suggestions, excluding existing connections
        // In a real app, you would use more sophisticated suggestion algorithms
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, profile_pic, student_id')
          .neq('id', user.id)
          .limit(5);
          
        if (profilesError) throw profilesError;
        
        // Filter out existing connections
        const suggestedProfiles = profiles.filter(
          profile => !existingConnLookup[profile.id]
        );
        
        setSuggestions(suggestedProfiles);
        
      } catch (error) {
        console.error('Error fetching friend suggestions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load friend suggestions',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [user, toast]);

  // Handle friend request
  const handleSendFriendRequest = async (friendId: string) => {
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
          friend_id: friendId,
          status: 'pending'
        });
        
      if (error) throw error;
      
      // Update local state
      setPendingRequests(prev => ({
        ...prev,
        [friendId]: true
      }));
      
      toast({
        title: 'Friend Request Sent',
        description: 'Your friend request has been sent'
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

  // If no suggestions or not logged in, don't show anything
  if (!user || (!isLoading && suggestions.length === 0)) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">People You May Know</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-2">
            <p className="text-gray-500">Loading suggestions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={suggestion.profile_pic} />
                    <AvatarFallback>{suggestion.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{suggestion.name}</p>
                    <p className="text-sm text-gray-500">ID: {suggestion.student_id}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={pendingRequests[suggestion.id] ? "outline" : "default"}
                  onClick={() => handleSendFriendRequest(suggestion.id)}
                  disabled={pendingRequests[suggestion.id]}
                >
                  {pendingRequests[suggestion.id] ? (
                    "Pending"
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" /> Add Friend
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
