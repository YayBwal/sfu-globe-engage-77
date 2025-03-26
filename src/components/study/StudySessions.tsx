
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { StudySession } from '@/pages/Study';
import { MapPin, Clock, Users, ExternalLink, Loader2, Lock, MessageSquare, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import MessagingPanel from './MessagingPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface StudySessionsProps {
  upcomingSessions: StudySession[];
  refetchSessions: () => void;
}

const StudySessions: React.FC<StudySessionsProps> = ({ upcomingSessions, refetchSessions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState<string>('');
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [messages, setMessages] = useState<{ text: string; sender: string; timestamp: Date }[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add real-time subscription to session participants
  useEffect(() => {
    if (!selectedSession) return;

    // Subscribe to changes in session participants for the selected session
    const channel = supabase
      .channel('session-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${selectedSession.id}`
        },
        (payload) => {
          console.log('Session participants changed:', payload);
          refetchSessions();
        }
      )
      .subscribe();

    // Subscribe to messages for the selected session
    const messagesChannel = supabase
      .channel('session-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_messages',
          filter: `session_id=eq.${selectedSession.id}`
        },
        async (payload) => {
          console.log('New message:', payload);
          if (payload.new) {
            // Fetch the user name for this message
            const { data: userData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', payload.new.user_id)
              .single();
            
            setMessages(prev => [
              ...prev,
              {
                text: payload.new.content,
                sender: payload.new.user_id === user?.id ? 'me' : userData?.name || 'Unknown',
                timestamp: new Date(payload.new.created_at)
              }
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedSession, refetchSessions, user?.id]);

  // Load initial messages when session is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedSession) return;

      try {
        const { data, error } = await supabase
          .from('session_messages')
          .select('*, profiles(name)')
          .eq('session_id', selectedSession.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          const formattedMessages = data.map(msg => ({
            text: msg.content,
            sender: msg.user_id === user?.id ? 'me' : msg.profiles?.name || 'Unknown',
            timestamp: new Date(msg.created_at)
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [selectedSession, user?.id]);

  const handleJoin = async (session: StudySession) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to join a study session",
        variant: "destructive",
      });
      navigate('/login?redirect=/study');
      return;
    }

    // Check if access code is required
    if (session.access_code) {
      setSelectedSession(session);
      setIsAccessCodeModalOpen(true);
      return;
    }

    await joinSession(session.id);
  };

  const joinSession = async (sessionId: string) => {
    try {
      setJoiningSessionId(sessionId);

      // Check if user already joined this session
      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user?.id)
        .single();

      if (existingParticipant) {
        toast({
          title: "Already joined",
          description: "You are already participating in this session",
        });
        
        // Select the session to show chat
        const session = upcomingSessions.find(s => s.id === sessionId);
        if (session) {
          setSelectedSession(session);
          setIsChatOpen(true);
        }
        return;
      }

      // Add user as participant
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: user?.id,
          joined_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Select the session to show chat
      const session = upcomingSessions.find(s => s.id === sessionId);
      if (session) {
        setSelectedSession(session);
        setIsChatOpen(true);
      }

      toast({
        title: "Success",
        description: "You have joined the study session",
      });

    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join study session",
        variant: "destructive",
      });
    } finally {
      setJoiningSessionId(null);
      setIsAccessCodeModalOpen(false);
      setAccessCodeInput('');
    }
  };

  const handleVerifyAccessCode = () => {
    if (!selectedSession) return;
    
    if (accessCodeInput === selectedSession.access_code) {
      joinSession(selectedSession.id);
    } else {
      toast({
        title: "Invalid access code",
        description: "The access code you entered is incorrect",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !selectedSession) return;
    
    try {
      const { error } = await supabase
        .from('session_messages')
        .insert({
          session_id: selectedSession.id,
          user_id: user.id,
          content: text
        });
        
      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getSessionAccessLink = (session: StudySession) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/study?session=${session.id}&code=${session.access_code}`;
  };

  const copySessionLink = (session: StudySession) => {
    const link = getSessionAccessLink(session);
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "Session link copied to clipboard"
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const isSessionHost = (session: StudySession) => {
    return user?.id === session.host_id;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (upcomingSessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <h3 className="text-xl font-semibold mb-4">No Upcoming Sessions</h3>
        <p className="text-gray-600 mb-6">
          There are no study sessions scheduled at the moment. Be the first to create one!
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <h3 className="text-xl font-semibold mb-2">Upcoming Study Sessions</h3>
        
        {upcomingSessions.map((session) => (
          <motion.div
            key={session.id}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
            variants={item}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h4 className="text-lg font-semibold mb-2 flex items-center">
                    {session.subject}
                    {session.access_code && (
                      <Lock className="h-4 w-4 ml-2 text-amber-500" />
                    )}
                  </h4>
                  
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {format(new Date(session.date), 'EEEE, MMMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-1">
                    {session.type === 'offline' ? (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{session.location}</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        <span className="text-sm">Online Session</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">{session.participants} participants</span>
                  </div>
                  
                  {isSessionHost(session) && session.access_code && (
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                        Access code: {session.access_code}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => copySessionLink(session)}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Sheet
                    open={isChatOpen && selectedSession?.id === session.id}
                    onOpenChange={(isOpen) => {
                      if (isOpen) {
                        setSelectedSession(session);
                      } else if (selectedSession?.id === session.id) {
                        setIsChatOpen(false);
                      }
                    }}
                  >
                    <SheetTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSelectedSession(session);
                          setIsChatOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Chat</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>Study Session Chat</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <MessagingPanel
                          student={{ 
                            name: session.subject, 
                            online: true, 
                            course: session.type === 'offline' ? session.location : 'Online', 
                            major: format(new Date(session.date), 'MMM d, yyyy • h:mm a')
                          }}
                          onBack={() => setIsChatOpen(false)}
                          messages={messages}
                          onSendMessage={handleSendMessage}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                  
                  <Button
                    onClick={() => handleJoin(session)}
                    disabled={joiningSessionId === session.id}
                    className="bg-sfu-red hover:bg-sfu-red/90"
                  >
                    {joiningSessionId === session.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Joining...
                      </>
                    ) : (
                      'Join Session'
                    )}
                  </Button>
                </div>
              </div>
              
              {session.description && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">{session.description}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Access Code Modal */}
      <Dialog
        open={isAccessCodeModalOpen}
        onOpenChange={setIsAccessCodeModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Access Code</DialogTitle>
            <DialogDescription>
              This study session requires an access code to join. Please enter the code provided by the session host.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Input
                type="text"
                placeholder="Enter access code"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleVerifyAccessCode}
              className="bg-sfu-red hover:bg-sfu-red/90"
              disabled={!accessCodeInput.trim()}
            >
              Join Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudySessions;
