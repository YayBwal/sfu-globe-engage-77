
import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  read: boolean;
}

interface FriendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: {
    id: string;
    name: string;
  };
}

const FriendMessageModal: React.FC<FriendMessageModalProps> = ({
  isOpen,
  onClose,
  friend,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch messages between current user and friend
  useEffect(() => {
    if (!isOpen || !user || !friend.id) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        // Get messages where either user is sender or receiver
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Mark received messages as read
        const unreadMessages = data?.filter(m => m.receiver_id === user.id && !m.read) || [];
        if (unreadMessages.length > 0) {
          const unreadIds = unreadMessages.map(m => m.id);
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadIds);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('new_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id}))`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages(current => [...current, newMsg]);

          // Mark received messages as read immediately
          if (newMsg.receiver_id === user.id && !newMsg.read) {
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user, friend.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !friend.id) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: friend.id,
          text: newMessage.trim(),
          read: false
        });

      if (error) throw error;

      // Create notification for the recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: friend.id,
          title: 'New Message',
          message: `You have a new message from ${user.email || 'a friend'}`,
          source: 'friend',
          type: 'info',
          is_read: false
        });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat with {friend.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[400px]">
          <ScrollArea className="flex-1 p-4 bg-gray-50 rounded-md mb-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-sfu-red border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      message.sender_id === user?.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[80%] ${
                        message.sender_id === user?.id
                          ? 'bg-sfu-red text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className="bg-sfu-red hover:bg-sfu-red/90 h-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FriendMessageModal;
