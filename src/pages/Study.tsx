
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StudySessions from '@/components/study/StudySessions';
import PartnerMatching from '@/components/study/PartnerMatching';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles, BookOpen, GraduationCap, Users } from 'lucide-react';
import CreateSessionDialog from '@/components/study/CreateSessionDialog';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export interface StudySession {
  id: string;
  subject: string;
  date: string;
  end_date?: string;
  location: string;
  type: "online" | "offline";
  password?: string | null;
  host_id: string;
  description?: string | null;
  meeting_link?: string | null;
  participants?: number;
  participants_count?: number;
  access_code?: string | null;
  status?: string;
}

const Study = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [upcomingSessions, setUpcomingSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sessions");

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Handle direct access via link with session ID and code
  useEffect(() => {
    const sessionId = searchParams.get('session');
    const accessCode = searchParams.get('code');
    
    if (sessionId && accessCode) {
      // Automatically verify and join session
      const autoJoinSession = async () => {
        try {
          // Verify session exists and code matches
          const { data, error } = await supabase
            .from('study_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('access_code', accessCode)
            .single();
            
          if (error || !data) {
            toast({
              title: "Invalid link",
              description: "The session link is invalid or expired",
              variant: "destructive"
            });
            return;
          }
          
          // The session and code are valid - now fetch sessions to ensure this one is loaded
          await fetchUpcomingSessions();
          
          // Simulate clicking the join button for this session
          // This will be handled by the StudySessions component
        } catch (error) {
          console.error("Error auto-joining session:", error);
        }
      };
      
      autoJoinSession();
    }
  }, [searchParams, toast]);

  // Fetch upcoming study sessions
  const fetchUpcomingSessions = async () => {
    try {
      setLoading(true);
      
      // Get upcoming sessions
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('status', 'active')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5);
        
      if (error) {
        throw error;
      }
      
      // Format the sessions
      const formattedSessions = data.map(session => ({
        id: session.id,
        subject: session.subject,
        date: session.date,
        end_date: session.end_date,
        location: session.location || 'Online',
        type: session.type as "online" | "offline",
        password: session.password,
        access_code: session.access_code,
        host_id: session.host_id,
        description: session.description,
        meeting_link: session.meeting_link,
        status: session.status,
        participants: 0 // We'll get this in a separate query
      }));
      
      // Get participant counts for each session
      const participantPromises = formattedSessions.map(session => 
        supabase
          .from('session_participants')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', session.id)
      );
      
      const participantResults = await Promise.all(participantPromises);
      
      // Add participant counts to sessions
      formattedSessions.forEach((session, index) => {
        session.participants = participantResults[index].count || 0;
      });
      
      setUpcomingSessions(formattedSessions);
      
    } catch (error) {
      console.error("Error fetching study sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load study sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle session deletion (only for hosts)
  const handleDeleteSession = async (session: StudySession) => {
    if (!user || user.id !== session.host_id) {
      toast({
        title: "Permission denied",
        description: "Only the host can delete their sessions",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id)
        .eq('host_id', user.id);

      if (error) throw error;

      // Update the local state by filtering out the deleted session
      setUpcomingSessions(prev => prev.filter(s => s.id !== session.id));

      toast({
        title: "Session deleted",
        description: "Your study session has been successfully deleted",
        variant: "default"
      });
    } catch (error) {
      console.error("Error deleting study session:", error);
      toast({
        title: "Error",
        description: "Failed to delete the study session",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUpcomingSessions();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-28">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4"
            variants={itemVariants}
          >
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
                <BookOpen className="mr-3 h-8 w-8 text-sfu-red" />
                Study Groups
              </h1>
              <p className="text-gray-600 max-w-lg">
                Connect with peers, share knowledge, and excel together in your academic journey
              </p>
            </div>
            
            <Button 
              onClick={() => setIsCreateSessionOpen(true)}
              className="bg-sfu-red hover:bg-sfu-red/90 flex items-center gap-2 rounded-full px-6 py-6 h-12 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <PlusCircle size={18} />
              Create Session
            </Button>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mb-6">
            <Tabs 
              defaultValue="sessions" 
              className="w-full"
              onValueChange={setActiveTab}
              value={activeTab}
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="sessions"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-sfu-red data-[state=active]:shadow-md transition-all duration-300 py-3"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    <span>Study Sessions</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="buddies"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-sfu-red data-[state=active]:shadow-md transition-all duration-300 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Find Study Buddy</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sessions" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <StudySessions 
                      upcomingSessions={upcomingSessions} 
                      refetchSessions={fetchUpcomingSessions}
                      onDeleteSession={handleDeleteSession}
                    />
                  </div>
                  
                  <div className="glass rounded-xl p-6 shadow-md">
                    <h3 className="text-xl font-semibold mb-5 flex items-center text-gray-800">
                      <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
                      Study Tips
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-sfu-red group-hover:scale-125 transition-transform"></span>
                        Create a dedicated study space
                      </li>
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-sfu-red group-hover:scale-125 transition-transform"></span>
                        Take regular short breaks (Pomodoro technique)
                      </li>
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-sfu-red group-hover:scale-125 transition-transform"></span>
                        Stay hydrated during study sessions
                      </li>
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-sfu-red group-hover:scale-125 transition-transform"></span>
                        Use active recall instead of passive review
                      </li>
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-sfu-red group-hover:scale-125 transition-transform"></span>
                        Join or create study groups for difficult subjects
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="buddies" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 glass rounded-xl p-6 shadow-md">
                    <h3 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                      <Users className="h-5 w-5 mr-2 text-blue-500" />
                      Find a Study Partner
                    </h3>
                    <PartnerMatching />
                  </div>
                  
                  <div className="glass rounded-xl p-6 shadow-md">
                    <h3 className="text-xl font-semibold mb-5 flex items-center text-gray-800">
                      <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
                      Partner Benefits
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                        Increased accountability
                      </li>
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                        Access to different perspectives
                      </li>
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                        Enhanced understanding through teaching
                      </li>
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                        Better retention of information
                      </li>
                      <li className="flex items-center gap-2 group">
                        <span className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                        More effective problem-solving
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
      
      <CreateSessionDialog 
        open={isCreateSessionOpen} 
        onOpenChange={setIsCreateSessionOpen} 
        onSessionCreated={fetchUpcomingSessions}
      />
      
      <Footer />
    </div>
  );
};

export default Study;
