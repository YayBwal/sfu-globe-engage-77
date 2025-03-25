
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StudySessions from '@/components/study/StudySessions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
          <h1 className="text-3xl font-bold mb-6">Study Groups</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left sidebar - can add filter controls here */}
            <div className="md:col-span-2">
              <StudySessions upcomingSessions={upcomingSessions} />
            </div>
            
            {/* Right sidebar - can add study resources or tips here */}
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
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Study;
