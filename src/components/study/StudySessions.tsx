
import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Video, User, Users, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StudySession } from "@/pages/Study";
import { useToast } from "@/hooks/use-toast";

interface StudySessionsProps {
  upcomingSessions: StudySession[];
}

const StudySessions: React.FC<StudySessionsProps> = ({ upcomingSessions }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSessionsFromSupabase();
  }, []);

  const fetchSessionsFromSupabase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          participants:session_participants(count)
        `)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      // Format the data to include the participants count
      const formattedSessions = data.map(session => ({
        id: session.id,
        subject: session.subject,
        date: session.date,
        location: session.location,
        type: session.type as "online" | "offline",
        password: session.password,
        host_id: session.host_id,
        description: session.description,
        meeting_link: session.meeting_link,
        participants_count: session.participants[0]?.count || 0
      }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error("Error fetching study sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (session: StudySession) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to join a study session",
        variant: "destructive",
      });
      return;
    }

    // For online sessions with passwords
    if (session.type === "online" && session.password) {
      setSelectedSession(session);
      setShowPasswordDialog(true);
      return;
    }

    // For in-person sessions or online without password
    try {
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: user.id
        });

      if (error) {
        // Check if it's because user is already in the session
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already joined",
            description: "You've already joined this study session",
          });
          return;
        }
        throw error;
      }

      // Also log this activity
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'study_session_join',
          activity_detail: {
            session_id: session.id,
            subject: session.subject
          }
        });

      toast({
        title: "Session joined",
        description: `You've successfully joined the ${session.subject} study session`,
      });

      // Refresh the sessions list
      fetchSessionsFromSupabase();
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join study session",
        variant: "destructive",
      });
    }
  };

  const verifySessionPassword = async () => {
    if (!selectedSession || !user) return;

    if (passwordInput === selectedSession.password) {
      try {
        const { error } = await supabase
          .from('session_participants')
          .insert({
            session_id: selectedSession.id,
            user_id: user.id
          });

        if (error) {
          if (error.code === '23505') { // Unique violation
            toast({
              title: "Already joined",
              description: "You've already joined this study session",
            });
            setShowPasswordDialog(false);
            setPasswordInput("");
            return;
          }
          throw error;
        }

        // Also log this activity
        await supabase
          .from('user_activities')
          .insert({
            user_id: user.id,
            activity_type: 'study_session_join',
            activity_detail: {
              session_id: selectedSession.id,
              subject: selectedSession.subject
            }
          });

        toast({
          title: "Session joined",
          description: selectedSession.meeting_link 
            ? "Session joined! You can now access the meeting link."
            : `You've successfully joined the ${selectedSession.subject} study session`,
        });

        setShowPasswordDialog(false);
        setPasswordInput("");
        fetchSessionsFromSupabase();
      } catch (error) {
        console.error("Error joining session:", error);
        toast({
          title: "Error",
          description: "Failed to join study session",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Incorrect password",
        description: "The password you entered is incorrect",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading study sessions...</p>
      </div>
    );
  }

  const allSessions = [...sessions, ...upcomingSessions];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Upcoming Study Sessions</h3>
        <Button size="sm" variant="outline">
          Create Session
        </Button>
      </div>

      {allSessions.length === 0 ? (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming sessions</h3>
          <p className="text-gray-500">Create a session to start studying with others</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allSessions.map((session) => (
            <Card key={session.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{session.subject}</h4>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(session.date)}</span>
                        <span className="mx-1">•</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{formatTime(session.date)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        {session.type === "online" ? (
                          <>
                            <Video className="h-4 w-4 mr-1" />
                            <span>Online Session</span>
                            {session.password && (
                              <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 flex items-center">
                                <Lock className="h-3 w-3 mr-1" />
                                Protected
                              </Badge>
                            )}
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{session.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {session.participants || session.participants_count || 0} joined
                    </Badge>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      size="sm"
                      onClick={() => joinSession(session)}
                      className="bg-sfu-red hover:bg-sfu-red/90"
                    >
                      Join Session
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Session Password</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              This study session is password protected. Please enter the password provided by the session host.
            </p>
            <Input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={verifySessionPassword} className="bg-sfu-red hover:bg-sfu-red/90">
                Join Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudySessions;
