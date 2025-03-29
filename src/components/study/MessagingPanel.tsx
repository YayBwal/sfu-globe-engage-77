import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';

interface MessagingPanelProps {
  student?: any;
  onBack?: () => void;
  messages?: { text: string; sender: string; timestamp: Date }[];
  onSendMessage?: (text: string) => void;
  // New props
  isOpen?: boolean;
  onClose?: () => void;
  sessionId?: string;
  sessionSubject?: string;
}

const MessagingPanel: React.FC<MessagingPanelProps> = ({ 
  student, 
  onBack, 
  messages: initialMessages,
  onSendMessage,
  isOpen,
  onClose,
  sessionId,
  sessionSubject
}) => {
  const [messageText, setMessageText] = useState("");
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isCallPending, setIsCallPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  // Local messages state
  const [messages, setMessages] = useState<{ text: string; sender: string; timestamp: Date }[]>(initialMessages || []);
  const [sessionParticipants, setSessionParticipants] = useState<any[]>([]);
  const [currentRecipient, setCurrentRecipient] = useState<any>(null);

  // If we're in a study session, fetch participants and messages
  useEffect(() => {
    if (sessionId) {
      fetchSessionParticipants();
      fetchSessionMessages();
    }
  }, [sessionId]);

  // Fetch session participants
  const fetchSessionParticipants = async () => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('user_id')
        .eq('session_id', sessionId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Get profile info for all participants
        const userIds = data.map(p => p.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        setSessionParticipants(profiles || []);
        
        // Set current recipient as the first participant that's not the current user
        if (profiles && profiles.length > 0 && user) {
          const otherParticipant = profiles.find(p => p.id !== user.id);
          if (otherParticipant) {
            setCurrentRecipient(otherParticipant);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching session participants:", error);
    }
  };

  // Fetch session messages
  const fetchSessionMessages = async () => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        const formattedMessages = data.map(msg => ({
          text: msg.content,
          sender: msg.user_id === user?.id ? 'me' : 'other',
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error fetching session messages:", error);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      const newMessage = {
        text: messageText,
        sender: 'me',
        timestamp: new Date()
      };
      
      // Add to local state first for immediate UI update
      setMessages(prev => [...prev, newMessage]);
      
      // Clear input
      setMessageText("");
      
      // If custom send handler is provided, use it
      if (onSendMessage) {
        onSendMessage(messageText);
        return;
      }
      
      // Otherwise save to database if we have a session
      if (sessionId && user) {
        const { error } = await supabase
          .from('session_messages')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            content: messageText
          });
          
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const initiateVideoCall = () => {
    const recipient = currentRecipient || student;
    if (!recipient?.online) {
      toast({
        title: "User offline",
        description: `${recipient?.name || 'User'} is currently offline`,
        variant: "destructive"
      });
      return;
    }

    setIsCallPending(true);
    
    // Simulate call acceptance after 2 seconds
    setTimeout(() => {
      setIsCallPending(false);
      setIsVideoCallActive(true);
      
      toast({
        title: "Video call started",
        description: `Connected with ${recipient?.name || 'user'}`,
      });
    }, 2000);
  };

  const endVideoCall = () => {
    setIsVideoCallActive(false);
    
    toast({
      title: "Call ended",
      description: `Call has ended`,
    });
  };

  // Handle back button click based on whether we're using onBack or onClose
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    }
  };

  const displayName = currentRecipient?.name || student?.name || sessionSubject || "Chat";

  // If we're in a session context but not open, don't render
  if (sessionId && isOpen === false) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-gray-200">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {displayName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold">{displayName}</h2>
              {(student?.online || currentRecipient?.online) && (
                <span className={`w-2 h-2 rounded-full ${(student?.online || currentRecipient?.online) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              )}
            </div>
            {(student?.course || currentRecipient?.major) && (
              <div className="text-xs text-gray-500">
                {student?.course || currentRecipient?.major} 
                {(student?.major || currentRecipient?.batch) && ` • ${student?.major || currentRecipient?.batch}`}
              </div>
            )}
            {sessionSubject && !student?.course && !currentRecipient?.major && (
              <div className="text-xs text-gray-500">Study Session</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isVideoCallActive ? (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={endVideoCall}
            >
              <VideoOff className="h-4 w-4 mr-1" />
              End Call
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              disabled={isCallPending || !(student?.online || currentRecipient?.online)}
              onClick={initiateVideoCall}
              className={!(student?.online || currentRecipient?.online) ? "opacity-50" : ""}
            >
              <Video className="h-4 w-4 mr-1" />
              {isCallPending ? "Calling..." : "Video Call"}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
          >
            Back
          </Button>
        </div>
      </div>
      
      {isVideoCallActive && (
        <div className="bg-black rounded-lg h-40 mb-4 flex items-center justify-center">
          <div className="text-white text-center">
            <p>Video call with {displayName}</p>
            <p className="text-xs text-gray-400 mt-1">Connected</p>
            <div className="absolute bottom-2 right-2 bg-gray-800 rounded w-20 h-16"></div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg h-80 overflow-y-auto mb-4 p-4">
        <div className="space-y-3">
          {messages?.length > 0 ? (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] px-3 py-2 rounded-lg ${
                    msg.sender === 'me' 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10">
              <p>No messages yet</p>
              <p className="text-xs mt-2">Send a message to start the conversation</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Input 
          type="text" 
          placeholder="Type your message..." 
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="bg-white"
        />
        <Button 
          variant="outline"
          onClick={handleSendMessage}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default MessagingPanel;
