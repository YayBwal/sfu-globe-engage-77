import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, UserCheck, MessageSquare, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/supabaseCustom';

// Use our custom typed supabase client
const typedSupabase = supabase as unknown as ReturnType<typeof supabase> & { 
  from: <T extends keyof Database['public']['Tables']>(
    table: T
  ) => ReturnType<typeof supabase.from> 
};

interface UserProfileViewProps {
  userId: string;
  onClose?: () => void;
}

interface UserProfileData {
  id: string;
  name: string;
  student_id: string;
  major: string;
  batch: string;
  bio: string | null;
  profile_pic: string | null;
  interests: string[] | null;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, student_id, major, batch, bio, profile_pic, interests')
          .eq('id', userId)
          .single();
          
        if (profileError) throw profileError;
        
        setProfile(profileData);
        
        // Check connection status if logged in
        if (user) {
          const { data: connectionData, error: connectionError } = await supabase
            .from('connections')
            .select('status')
            .eq('user_id', user.id)
            .eq('friend_id', userId)
            .maybeSingle();
            
          if (connectionError) throw connectionError;
          
          if (connectionData) {
            setConnectionStatus(connectionData.status);
          } else {
            // Check reverse connection (if they sent a request to us)
            const { data: reverseData, error: reverseError } = await supabase
              .from('connections')
              .select('status')
              .eq('user_id', userId)
              .eq('friend_id', user.id)
              .maybeSingle();
              
            if (reverseError) throw reverseError;
            
            if (reverseData && reverseData.status === 'pending') {
              setConnectionStatus('incoming');
            } else if (reverseData && reverseData.status === 'accepted') {
              setConnectionStatus('accepted');
            } else {
              setConnectionStatus(null);
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId, user, toast]);

  const handleSendFriendRequest = async () => {
    if (!user || !profile) return;
    
    try {
      setActionLoading(true);
      
      // Create connection record
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          friend_id: userId,
          status: 'pending'
        });
        
      if (error) throw error;
      
      // Update local state
      setConnectionStatus('pending');
      
      toast({
        title: 'Friend Request Sent',
        description: `Friend request sent to ${profile.name}`,
      });
      
      // Send notification to the user
      await typedSupabase
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
        title: 'Request Failed',
        description: 'Failed to send friend request',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!user || !profile) return;
    
    try {
      setActionLoading(true);
      
      // Update the incoming connection to accepted
      const { error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('user_id', userId)
        .eq('friend_id', user.id);
        
      if (updateError) throw updateError;
      
      // Create a reciprocal connection
      const { error: insertError } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          friend_id: userId,
          status: 'accepted'
        });
        
      if (insertError) throw insertError;
      
      // Update local state
      setConnectionStatus('accepted');
      
      toast({
        title: 'Friend Request Accepted',
        description: `You are now friends with ${profile.name}`,
      });
      
      // Send notification to the user
      await typedSupabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Friend Request Accepted',
          message: `Your friend request has been accepted`,
          source: 'friend',
          type: 'success'
        });
        
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Action Failed',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    // Implement chat functionality
    toast({
      title: 'Chat Feature',
      description: 'Chat functionality will be implemented soon',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-2 text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">User Not Found</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-gray-500">This user profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">User Profile</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={profile.profile_pic || undefined} />
          <AvatarFallback className="text-2xl">{profile.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold">{profile.name}</h3>
        <p className="text-gray-500">Student ID: {profile.student_id}</p>
        <div className="flex mt-2 space-x-2">
          <Badge>{profile.major}</Badge>
          <Badge variant="outline">Batch {profile.batch}</Badge>
        </div>
      </div>
      
      {profile.bio && (
        <div className="mb-4">
          <h4 className="font-medium mb-1">Bio</h4>
          <p className="text-gray-600">{profile.bio}</p>
        </div>
      )}
      
      {profile.interests && profile.interests.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-1">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest, index) => (
              <Badge key={index} variant="secondary">{interest}</Badge>
            ))}
          </div>
        </div>
      )}
      
      <Separator className="my-4" />
      
      {user && user.id !== userId && (
        <div className="flex justify-center space-x-2">
          {connectionStatus === null && (
            <Button 
              onClick={handleSendFriendRequest} 
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add Friend
            </Button>
          )}
          
          {connectionStatus === 'pending' && (
            <Button variant="outline" disabled>
              <UserClock className="h-4 w-4 mr-2" />
              Request Sent
            </Button>
          )}
          
          {connectionStatus === 'incoming' && (
            <Button 
              onClick={handleAcceptFriendRequest}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Accept Request
            </Button>
          )}
          
          {connectionStatus === 'accepted' && (
            <Button 
              variant="outline" 
              onClick={handleStartChat}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
