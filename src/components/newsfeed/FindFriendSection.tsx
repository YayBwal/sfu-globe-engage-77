import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UserProfileView } from "@/components/friends/UserProfileView";
import { Database } from '@/types/supabaseCustom';

interface UserResult {
  id: string;
  name: string;
  student_id: string;
  profile_pic?: string;
}

export const FindFriendSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use our custom typed supabase client
  const typedSupabase = supabase as unknown as ReturnType<typeof supabase> & { 
    from: <T extends keyof Database['public']['Tables']>(
      table: T
    ) => ReturnType<typeof supabase.from> 
  };

  // Handle search for users
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setIsSearching(true);
      
      // Search for users by name or student ID
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, student_id, profile_pic')
        .or(`name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`)
        .limit(5);
        
      if (error) throw error;
      
      // Filter out current user
      const filteredResults = user ? data.filter(profile => profile.id !== user.id) : data;
      
      setSearchResults(filteredResults);
      
      // Check existing connections for each result
      if (user && filteredResults.length > 0) {
        const userIds = filteredResults.map(result => result.id);
        
        const { data: connections, error: connectionsError } = await supabase
          .from('connections')
          .select('friend_id, status')
          .eq('user_id', user.id)
          .in('friend_id', userIds);
          
        if (connectionsError) throw connectionsError;
        
        // Create a lookup for pending requests
        const pendingLookup: Record<string, boolean> = {};
        connections.forEach(conn => {
          pendingLookup[conn.friend_id] = conn.status === 'pending';
        });
        
        setPendingRequests(pendingLookup);
      }
      
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search for users. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

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
      
      // Send notification to the user
      await typedSupabase
        .from('notifications')
        .insert({
          user_id: friendId,
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

  const viewUserProfile = (userId: string) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Find Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input 
            placeholder="Search by name or student ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchTerm.trim()}
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {isSearching ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Searching...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map(result => (
              <div key={result.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div 
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => viewUserProfile(result.id)}
                >
                  <Avatar>
                    <AvatarImage src={result.profile_pic} />
                    <AvatarFallback>{result.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-gray-500">ID: {result.student_id}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={pendingRequests[result.id] ? "outline" : "default"}
                  onClick={() => handleSendFriendRequest(result.id)}
                  disabled={pendingRequests[result.id]}
                >
                  {pendingRequests[result.id] ? (
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
        ) : searchTerm ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : null}
      </CardContent>

      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedUserId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedUserId && (
            <UserProfileView 
              userId={selectedUserId} 
              onClose={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
