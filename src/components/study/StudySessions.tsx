
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Eye, EyeOff, Users, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { StudySession } from '@/pages/Study';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface StudySessionsProps {
  upcomingSessions: StudySession[];
  refetchSessions: () => Promise<void>;
}

const StudySessions: React.FC<StudySessionsProps> = ({ upcomingSessions, refetchSessions }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState<boolean>(false);
  
  // Function to handle joining a session
  const handleJoinSession = async (session: StudySession) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join study sessions",
        variant: "destructive"
      });
      return;
    }
    
    // If session requires password
    if (session.password) {
      setSelectedSession(session);
      setIsPasswordModalOpen(true);
      return;
    }
    
    await joinSession(session);
  };
  
  // Submit password and join session
  const handlePasswordSubmit = async () => {
    if (!selectedSession) return;
    
    if (passwordInput !== selectedSession.password) {
      toast({
        title: "Incorrect password",
        description: "The password you entered is incorrect",
        variant: "destructive"
      });
      return;
    }
    
    await joinSession(selectedSession);
    setIsPasswordModalOpen(false);
    setPasswordInput('');
  };
  
  // Actual join session logic
  const joinSession = async (session: StudySession) => {
    try {
      setIsJoining(true);
      
      // Check if user is already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('user_id', user?.id)
        .single();
        
      if (existingParticipant) {
        // User already joined - open messaging
        setSelectedSession(session);
        setIsMessagingOpen(true);
        return;
      }
      
      // Add user as participant
      const { error: joinError } = await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: user?.id,
          joined_at: new Date().toISOString()
        });
        
      if (joinError) throw joinError;
      
      // Update UI
      await refetchSessions();
      
      toast({
        title: "Success!",
        description: "You've joined the study session"
      });
      
      // Open messaging panel
      setSelectedSession(session);
      setIsMessagingOpen(true);
      
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join the study session",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  // Close the messaging panel
  const handleCloseMessaging = () => {
    setIsMessagingOpen(false);
    setSelectedSession(null);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Study Sessions</h2>
      
      {upcomingSessions.length === 0 ? (
        <Card className="bg-white/50 backdrop-blur-sm shadow-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No upcoming study sessions available.</p>
            <p className="text-sm text-gray-400 mt-1">Create one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcomingSessions.map((session) => (
            <Card key={session.id} className="bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between">
                    <h3 className="text-xl font-semibold text-gray-800">{session.subject}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.type === 'online' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {session.type === 'online' ? 'Online' : 'In Person'}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{
                        session.date 
                          ? format(parseISO(session.date), 'EEEE, MMMM d, yyyy • h:mm a') 
                          : 'Date not specified'
                      }</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{session.location || 'Location not specified'}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{session.participants || 0} participants</span>
                    </div>
                  </div>
                  
                  {session.description && (
                    <div className="mt-3 text-gray-600 text-sm">
                      <p>{session.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    {session.password && (
                      <div className="text-xs text-amber-600 flex items-center mr-3">
                        <EyeOff className="h-3 w-3 mr-1" />
                        <span>Password protected</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {session.type === 'online' && session.meeting_link && (
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => window.open(session.meeting_link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Join Meeting
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleJoinSession(session)}
                      size="sm"
                      variant="default"
                      className="bg-sfu-red hover:bg-sfu-red/90 text-white"
                      disabled={isJoining}
                    >
                      {selectedSession?.id === session.id && isJoining ? 'Joining...' : 'Join Session'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Session Password</DialogTitle>
            <DialogDescription>
              This study session is password protected. Please enter the password to join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordInput('');
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handlePasswordSubmit}
              disabled={!passwordInput}
            >
              Join Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Messaging Panel */}
      {selectedSession && isMessagingOpen && (
        <MessagingPanel
          sessionId={selectedSession.id}
          sessionSubject={selectedSession.subject}
          onClose={handleCloseMessaging}
          isOpen={isMessagingOpen}
        />
      )}
    </div>
  );
};

export default StudySessions;
