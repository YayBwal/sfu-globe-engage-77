import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import FriendMessageModal from '@/components/profile/FriendMessageModal';

interface MessagePreview {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  sender_pic?: string;
  text: string;
  created_at: string;
  read: boolean;
  online: boolean;
}

export const MessagesSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messagePreviews, setMessagePreviews] = useState<MessagePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // Fetch message previews
  useEffect(() => {
    if (!user) return;
    
    const fetchMessagePreviews = async () => {
      try {
        setIsLoading(true);
        
        // Get the latest message from each conversation
        const { data: sentMessages, error: sentError } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            text,
            created_at,
            read,
            profiles!messages_receiver_id_fkey (
              name,
              profile_pic,
              online
            )
          `)
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });
          
        if (sentError) throw sentError;
        
        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            text,
            created_at,
            read,
            profiles!messages_sender_id_fkey (
              name,
              profile_pic,
              online
            )
          `)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false });
          
        if (receivedError) throw receivedError;
        
        // Process sent messages
        const sentPreviews = sentMessages?.map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          sender_name: msg.profiles.name,
          sender_pic: msg.profiles.profile_pic,
          text: msg.text,
          created_at: msg.created_at,
          read: msg.read,
          online: msg.profiles.online || false
        })) || [];
        
        // Process received messages
        const receivedPreviews = receivedMessages?.map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          sender_name: msg.profiles.name,
          sender_pic: msg.profiles.profile_pic,
          text: msg.text,
          created_at: msg.created_at,
          read: msg.read,
          online: msg.profiles.online || false
        })) || [];
        
        // Combine and remove duplicates (keep only the latest message from each conversation)
        const allPreviews = [...sentPreviews, ...receivedPreviews];
        const uniqueConversations = new Map();
        
        allPreviews.forEach(msg => {
          const contactId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          
          if (!uniqueConversations.has(contactId) || 
              new Date(msg.created_at) > new Date(uniqueConversations.get(contactId).created_at)) {
            uniqueConversations.set(contactId, msg);
          }
        });
        
        // Sort by date (newest first)
        const sortedPreviews = Array.from(uniqueConversations.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setMessagePreviews(sortedPreviews);
        
      } catch (error) {
        console.error('Error fetching message previews:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessagePreviews();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('new_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, 
        (payload) => {
          fetchMessagePreviews();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Filter messages based on search query
  const filteredMessages = messagePreviews.filter(msg => 
    msg.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleOpenChat = (friendId: string, friendName: string) => {
    setActiveChat({ id: friendId, name: friendName });
    setIsMessageModalOpen(true);
  };

  // If user is not logged in, don't show anything
  if (!user) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Messages</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-sfu-red border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : filteredMessages.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredMessages.map((message) => {
                const isSentByUser = message.sender_id === user.id;
                const contactId = isSentByUser ? message.receiver_id : message.sender_id;
                const contactName = message.sender_name;
                
                return (
                  <div 
                    key={message.id}
                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${!message.read && !isSentByUser ? 'bg-blue-50' : ''}`}
                    onClick={() => handleOpenChat(contactId, contactName)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={message.sender_pic} />
                          <AvatarFallback>{contactName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span 
                          className={`absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white ${message.online ? 'bg-green-500' : 'bg-gray-400'}`}
                        ></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{contactName}</p>
                          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {isSentByUser && (
                            <span className="text-xs text-gray-500 mr-1">You: </span>
                          )}
                          <p className="text-sm text-gray-600 truncate">
                            {message.text}
                          </p>
                          {!message.read && !isSentByUser && (
                            <span className="ml-1 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-medium text-gray-800 mb-1">No messages yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'No messages match your search' : 'Start a conversation with one of your friends'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Message modal for active chat */}
      {activeChat && isMessageModalOpen && (
        <FriendMessageModal
          isOpen={isMessageModalOpen}
          onClose={() => {
            setIsMessageModalOpen(false);
            setActiveChat(null);
          }}
          friend={{
            id: activeChat.id,
            name: activeChat.name
          }}
        />
      )}
    </Card>
  );
};
