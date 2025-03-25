
import React, { useRef, useEffect, useState } from 'react';
import { Copy, Bookmark, UserPlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ShareOptionsProps {
  onCopyLink: () => void;
  onSavePost: () => void;
  onShareWithFriend: (friendId: string) => void;
  onClose: () => void;
}

export const ShareOptions: React.FC<ShareOptionsProps> = ({ 
  onCopyLink, 
  onSavePost, 
  onShareWithFriend,
  onClose 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Close the share options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Fetch friends when search term changes
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user || !searchTerm.trim()) {
        setFriends([]);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get friends where connection status is 'accepted'
        const { data, error } = await supabase
          .from('connections')
          .select(`
            friend_id,
            profiles:friend_id (
              id,
              name,
              profile_pic
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .ilike('profiles.name', `%${searchTerm}%`)
          .limit(5);
          
        if (error) {
          throw error;
        }
        
        const friendsList = data.map(item => item.profiles);
        setFriends(friendsList);
        
      } catch (error) {
        console.error("Error fetching friends:", error);
        setFriends([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriends();
  }, [user, searchTerm]);

  return (
    <div 
      ref={ref}
      className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg p-3 z-10 w-64"
    >
      <div className="grid grid-cols-1 gap-2">
        <button
          className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors text-left"
          onClick={onCopyLink}
        >
          <Copy className="h-4 w-4" />
          <span>Copy link</span>
        </button>
        
        <button
          className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors text-left"
          onClick={onSavePost}
        >
          <Bookmark className="h-4 w-4" />
          <span>Save post</span>
        </button>
        
        <div className="border-t my-2"></div>
        
        <div>
          <p className="text-sm font-medium mb-2">Share with a friend</p>
          <Input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          {isLoading ? (
            <p className="text-xs text-gray-500 text-center py-2">Loading...</p>
          ) : friends.length > 0 ? (
            <div className="max-h-36 overflow-y-auto">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  className="flex items-center gap-2 p-2 w-full rounded-md hover:bg-gray-100 transition-colors text-left"
                  onClick={() => onShareWithFriend(friend.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={friend.profile_pic} />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{friend.name}</span>
                </button>
              ))}
            </div>
          ) : searchTerm ? (
            <p className="text-xs text-gray-500 text-center py-2">No friends found</p>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">Search for friends to share with</p>
          )}
        </div>
      </div>
    </div>
  );
};
