
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StudySessions from '@/components/study/StudySessions';
import PartnerMatching from '@/components/study/PartnerMatching';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import CreateSessionDialog from '@/components/study/CreateSessionDialog';

export interface StudySession {
  id: string;
  subject: string;
  date: string;
  location: string;
  type: "online" | "offline";
  password?: string | null;
  host_id: string;
  description?: string | null;
  meeting_link?: string | null;
  participants?: number;
  participants_count?: number;
}

const Study = () => {
  const { toast } = useToast();
  const [upcomingSessions, setUpcomingSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);

  // Fetch upcoming study sessions
  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      try {
        setLoading(true);
        
        // Get upcoming sessions
        const { data, error } = await supabase
          .from('study_sessions')
          .select('*')
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
          location: session.location || 'Online',
          type: session.type as "online" | "offline",
          password: session.password,
          host_id: session.host_id,
          description: session.description,
          meeting_link: session.meeting_link,
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
    
    fetchUpcomingSessions();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Study Groups</h1>
            <Button 
              onClick={() => setIsCreateSessionOpen(true)}
              className="bg-sfu-red hover:bg-sfu-red/90 flex items-center gap-2"
            >
              <PlusCircle size={18} />
              Create Session
            </Button>
          </div>
          
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sessions">Study Sessions</TabsTrigger>
              <TabsTrigger value="buddies">Find Study Buddy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sessions" className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <StudySessions upcomingSessions={upcomingSessions} />
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Study Tips</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Create a dedicated study space</li>
                  <li>• Take regular short breaks (Pomodoro technique)</li>
                  <li>• Stay hydrated during study sessions</li>
                  <li>• Use active recall instead of passive review</li>
                  <li>• Join or create study groups for difficult subjects</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="buddies">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Find a Study Partner</h3>
                  <PartnerMatching />
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Partner Benefits</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Increased accountability</li>
                    <li>• Access to different perspectives</li>
                    <li>• Enhanced understanding through teaching</li>
                    <li>• Better retention of information</li>
                    <li>• More effective problem-solving</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <CreateSessionDialog 
        open={isCreateSessionOpen} 
        onOpenChange={setIsCreateSessionOpen} 
      />
      
      <Footer />
    </div>
  );
};

export default Study;
