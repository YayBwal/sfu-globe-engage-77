
import React from 'react';
import { format } from 'date-fns';
import { StudySession } from '@/pages/Study';
import { MapPin, Clock, Users, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface StudySessionsProps {
  upcomingSessions: StudySession[];
}

const StudySessions: React.FC<StudySessionsProps> = ({ upcomingSessions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [joiningSessionId, setJoiningSessionId] = React.useState<string | null>(null);

  const handleJoin = async (sessionId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to join a study session",
        variant: "destructive",
      });
      navigate('/login?redirect=/study');
      return;
    }

    try {
      setJoiningSessionId(sessionId);

      // Check if user already joined this session
      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        toast({
          title: "Already joined",
          description: "You are already participating in this session",
        });
        return;
      }

      // Add user as participant
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        });

      if (error) throw error;

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
    }
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
                <h4 className="text-lg font-semibold mb-2">{session.subject}</h4>
                
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
              </div>
              
              <Button
                onClick={() => handleJoin(session.id)}
                disabled={joiningSessionId === session.id}
                className="bg-sfu-red hover:bg-sfu-red/90 self-end md:self-center"
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
            
            {session.description && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">{session.description}</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StudySessions;
