
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { TypedSupabaseClient } from '@/types/supabaseCustom';
import { useAuth } from '@/contexts/AuthContext';
import FriendMessageModal from '@/components/profile/FriendMessageModal';
import { Clock } from 'lucide-react';

const typedSupabase = supabase as unknown as TypedSupabaseClient;

type UserProfileViewProps = {
  userId: string;
  onClose?: () => void;
};

const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await typedSupabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (profileError) {
          throw profileError;
        }
        
        if (profileData) {
          setProfile({
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            student_id: profileData.student_id,
            major: profileData.major,
            batch: profileData.batch,
            bio: profileData.bio || '',
            interests: profileData.interests || [],
            online: profileData.online || false,
            profilePic: profileData.profile_pic,
            profile_pic: profileData.profile_pic,
            cover_pic: profileData.cover_pic,
            coverPic: profileData.cover_pic,
            availability: profileData.availability || '',
            approval_status: profileData.approval_status,
            student_id_photo: profileData.student_id_photo,
            theme_preference: profileData.theme_preference,
          });
        }
        
        // Check connection status if this is another user (not self)
        if (user && userId !== user.id) {
          const { data: connectionData, error: connectionError } = await typedSupabase
            .from('connections')
            .select('status')
            .or(`user_id.eq.${user.id}.and.friend_id.eq.${userId},user_id.eq.${userId}.and.friend_id.eq.${user.id}`)
            .maybeSingle();
            
          if (!connectionError && connectionData) {
            setConnectionStatus(connectionData.status);
          } else {
            setConnectionStatus(null); // No connection
          }
        }
        
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId, user]);
  
  const handleConnect = async () => {
    if (!user || !profile) return;
    
    try {
      await typedSupabase
        .from('connections')
        .insert({
          user_id: user.id,
          friend_id: profile.id,
          status: 'pending'
        });
        
      setConnectionStatus('pending');
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };
  
  const handleCancelRequest = async () => {
    if (!user || !profile) return;
    
    try {
      await typedSupabase
        .from('connections')
        .delete()
        .or(`user_id.eq.${user.id}.and.friend_id.eq.${profile.id},user_id.eq.${profile.id}.and.friend_id.eq.${user.id}`);
        
      setConnectionStatus(null);
    } catch (error) {
      console.error("Error canceling friend request:", error);
    }
  };
  
  const handleAcceptRequest = async () => {
    if (!user || !profile) return;
    
    try {
      await typedSupabase
        .from('connections')
        .update({ status: 'accepted' })
        .or(`user_id.eq.${profile.id}.and.friend_id.eq.${user.id}`);
        
      setConnectionStatus('accepted');
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };
  
  const handleRejectRequest = async () => {
    if (!user || !profile) return;
    
    try {
      await typedSupabase
        .from('connections')
        .delete()
        .or(`user_id.eq.${profile.id}.and.friend_id.eq.${user.id}`);
        
      setConnectionStatus(null);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!profile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">User profile not found</p>
          {onClose && (
            <div className="mt-4 text-center">
              <Button onClick={onClose}>Close</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  const isCurrentUser = user && user.id === profile.id;
  const isFriend = connectionStatus === 'accepted';
  const hasPendingOutgoing = connectionStatus === 'pending' && !isCurrentUser;
  const hasPendingIncoming = connectionStatus === 'pending' && !isCurrentUser;
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-0">
        {/* Cover Image */}
        <div 
          className="h-40 bg-gray-200 bg-cover bg-center"
          style={{ backgroundImage: profile.coverPic ? `url(${profile.coverPic})` : 'none' }}
        />
        
        {/* Profile Content */}
        <div className="p-6 relative">
          {/* Profile Picture */}
          <div className="absolute -top-16 left-6">
            <div className="relative">
              {profile.profilePic ? (
                <img 
                  src={profile.profilePic} 
                  alt={profile.name} 
                  className="w-24 h-24 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {profile.name.charAt(0)}
                  </span>
                </div>
              )}
              
              {/* Online Status */}
              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${profile.online ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
          </div>
          
          {/* Actions */}
          {!isCurrentUser && (
            <div className="flex justify-end mb-8">
              {!connectionStatus && (
                <Button variant="default" onClick={handleConnect}>
                  Connect
                </Button>
              )}
              
              {hasPendingOutgoing && (
                <Button variant="outline" onClick={handleCancelRequest}>
                  Cancel Request
                </Button>
              )}
              
              {hasPendingIncoming && (
                <div className="space-x-2">
                  <Button variant="default" onClick={handleAcceptRequest}>
                    Accept
                  </Button>
                  <Button variant="outline" onClick={handleRejectRequest}>
                    Reject
                  </Button>
                </div>
              )}
              
              {isFriend && (
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setShowMessageModal(true)}>
                    Message
                  </Button>
                  <Button variant="destructive" onClick={handleCancelRequest}>
                    Unfriend
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* User Info */}
          <div className="mt-10">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              {profile.online && (
                <Badge variant="default" className="ml-2 bg-green-500">Online</Badge>
              )}
            </div>
            
            <div className="mt-1 text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>Last seen 2 hours ago</span>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">Student ID</p>
                <p className="font-medium">{profile.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Major</p>
                <p className="font-medium">{profile.major}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Batch</p>
                <p className="font-medium">{profile.batch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            
            {profile.bio && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Bio</p>
                <p className="mt-1">{profile.bio}</p>
              </div>
            )}
            
            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {profile.availability && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Availability</p>
                <p className="mt-1">{profile.availability}</p>
              </div>
            )}
          </div>
          
          {/* Close button if in modal */}
          {onClose && (
            <div className="mt-8 text-center">
              <Button onClick={onClose}>Close</Button>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Message Modal */}
      {showMessageModal && profile && (
        <FriendMessageModal 
          friend={profile}
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </Card>
  );
};

export default UserProfileView;
