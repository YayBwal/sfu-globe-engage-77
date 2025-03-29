
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { StudySession } from '@/pages/Study';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MessagingPanel from './MessagingPanel';
import SessionCard from './SessionCard';
import PasswordModal from './PasswordModal';
import { useSessionJoin } from '@/hooks/useSessionJoin';

interface StudySessionsProps {
  upcomingSessions: StudySession[];
  refetchSessions: () => Promise<void>;
}

const StudySessions: React.FC<StudySessionsProps> = ({ upcomingSessions, refetchSessions }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState<boolean>(false);
  
  const { 
    joinSession, 
    hasJoinedSession, 
    isJoining 
  } = useSessionJoin(refetchSessions);
  
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
  const handlePasswordSubmit = async (password: string) => {
    if (!selectedSession) return;
    
    if (password !== selectedSession.password) {
      toast({
        title: "Incorrect password",
        description: "The password you entered is incorrect",
        variant: "destructive"
      });
      return;
    }
    
    const success = await joinSession(selectedSession);
    if (success) {
      setIsPasswordModalOpen(false);
    }
  };
  
  // Open chat with session
  const handleOpenChat = (session: StudySession) => {
    setSelectedSession(session);
    setIsMessagingOpen(true);
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
          {upcomingSessions.map((session) => {
            const joined = hasJoinedSession(session.id);
            
            return (
              <SessionCard
                key={session.id}
                session={session}
                joined={joined}
                isJoining={isJoining}
                onJoin={handleJoinSession}
                onOpenChat={handleOpenChat}
              />
            );
          })}
        </div>
      )}
      
      {/* Password Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />
      
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
