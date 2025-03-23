
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessagingPanelProps {
  student: any;
  onBack: () => void;
  messages: { text: string; sender: string; timestamp: Date }[];
  onSendMessage: (text: string) => void;
}

const MessagingPanel: React.FC<MessagingPanelProps> = ({ 
  student, 
  onBack, 
  messages,
  onSendMessage
}) => {
  const [messageText, setMessageText] = useState("");
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isCallPending, setIsCallPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText);
    setMessageText("");
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const initiateVideoCall = () => {
    if (!student.online) {
      toast({
        title: "User offline",
        description: `${student.name} is currently offline`,
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
        description: `Connected with ${student.name}`,
      });
    }, 2000);
  };

  const endVideoCall = () => {
    setIsVideoCallActive(false);
    
    toast({
      title: "Call ended",
      description: `Call with ${student.name} has ended`,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-gray-200">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {student.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold">{student.name}</h2>
              <span className={`w-2 h-2 rounded-full ${student.online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            </div>
            <div className="text-xs text-gray-500">{student.course} • {student.major}</div>
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
              variant={student.online ? "outline" : "ghost"} 
              size="sm"
              disabled={isCallPending || !student.online}
              onClick={initiateVideoCall}
              className={!student.online ? "opacity-50" : ""}
            >
              <Video className="h-4 w-4 mr-1" />
              {isCallPending ? "Calling..." : "Video Call"}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </div>
      
      {isVideoCallActive && (
        <div className="bg-black rounded-lg h-40 mb-4 flex items-center justify-center">
          <div className="text-white text-center">
            <p>Video call with {student.name}</p>
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
