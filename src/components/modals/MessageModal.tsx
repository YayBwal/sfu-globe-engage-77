
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/utils/notificationHelpers';
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  student_id?: string;
  major?: string;
  image?: string | null;
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: UserProfile | null;
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, recipient }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!message.trim() || !recipient || !user) {
      return;
    }

    setIsSending(true);

    try {
      // Store message in the database
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: recipient.id,
          text: message
        });

      if (error) throw error;

      // Create notification for recipient
      await createNotification(
        recipient.id,
        'New Message',
        `You have received a message from ${user.email || 'a user'}`,
        'info',
        'messages'
      );

      toast({
        title: "Message sent",
        description: `Your message was sent to ${recipient.name}`,
      });

      setMessage('');
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send message to {recipient?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || isSending}
            >
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageModal;
