
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, BookOpen, Clock, Calendar, Wifi, Lock, Globe, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StudySession {
  id: string;
  subject: string;
  date: string;
  location: string | null;
  type: "online" | "offline";
  password?: string | null;
  host_id: string;
  participants_count?: number;
  meeting_link?: string | null;
  description?: string | null;
}

interface StudySessionsProps {
  upcomingSessions?: StudySession[];
}

const StudySessions: React.FC<StudySessionsProps> = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [sessionDetails, setSessionDetails] = useState<StudySession | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [sessionToJoin, setSessionToJoin] = useState<string | null>(null);
  const [todayHasSession, setTodayHasSession] = useState(false);
  const [newSession, setNewSession] = useState({
    subject: "",
    date: "",
    location: "",
    type: "offline" as "online" | "offline",
    password: "",
    meeting_link: "",
    description: ""
  });

  // Fetch study sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('study_sessions')
          .select(`
            id,
            subject,
            date,
            location,
            type,
            password,
            host_id,
            description,
            meeting_link
          `)
          .order('date', { ascending: true })
          .gte('date', new Date().toISOString());
        
        if (error) throw error;
        
        // Get participant counts for each session
        const sessionsWithCounts = await Promise.all(
          data.map(async (session) => {
            const { count, error: countError } = await supabase
              .from('session_participants')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id);
            
            if (countError) throw countError;
            
            return {
              ...session,
              participants_count: count || 0
            };
          })
        );
        
        setSessions(sessionsWithCounts);
        
        // Check if user has a session today
        if (user) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const { data: userSessions, error: userSessionError } = await supabase
            .from('study_sessions')
            .select('id')
            .eq('host_id', user.id)
            .gte('date', today.toISOString())
            .lt('date', tomorrow.toISOString());
          
          if (userSessionError) throw userSessionError;
          
          setTodayHasSession(userSessions.length > 0);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load study sessions",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessions();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('study-sessions-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'study_sessions' 
        }, 
        () => {
          fetchSessions();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSession(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setNewSession(prev => ({ 
      ...prev, 
      type: value as "online" | "offline",
      // Clear password and meeting link if type is offline
      password: value === "offline" ? "" : prev.password,
      meeting_link: value === "offline" ? "" : prev.meeting_link
    }));
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to create a study session",
        variant: "destructive"
      });
      return;
    }

    if (todayHasSession) {
      toast({
        title: "Session limit reached",
        description: "You can only create one study session per day",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!newSession.subject || !newSession.date) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // For online sessions, validate password and meeting link
    if (newSession.type === "online" && (!newSession.password || !newSession.meeting_link)) {
      toast({
        title: "Missing information",
        description: "Online sessions require a password and meeting link",
        variant: "destructive"
      });
      return;
    }

    // For offline sessions, validate location
    if (newSession.type === "offline" && !newSession.location) {
      toast({
        title: "Location required",
        description: "Offline sessions require a location",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert session into Supabase
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          subject: newSession.subject,
          date: new Date(newSession.date).toISOString(),
          location: newSession.type === "offline" ? newSession.location : null,
          type: newSession.type,
          password: newSession.type === "online" ? newSession.password : null,
          meeting_link: newSession.type === "online" ? newSession.meeting_link : null,
          description: newSession.description || null,
          host_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add host as a participant automatically
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert({
          session_id: data.id,
          user_id: user.id
        });
      
      if (participantError) throw participantError;
      
      // Success message
      toast({
        title: "Session created",
        description: `Your ${newSession.type} study session has been created`,
      });

      // Reset form
      setNewSession({
        subject: "",
        date: "",
        location: "",
        type: "offline",
        password: "",
        meeting_link: "",
        description: ""
      });
      
      setTodayHasSession(true);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create study session",
        variant: "destructive"
      });
    }
  };

  const handleJoinSession = async (session: StudySession) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to join a study session",
        variant: "destructive"
      });
      return;
    }

    // Check if already joined
    const { data: existingParticipant, error: checkError } = await supabase
      .from('session_participants')
      .select('id')
      .eq('session_id', session.id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking participant:', checkError);
      toast({
        title: "Error",
        description: "Failed to check session status",
        variant: "destructive"
      });
      return;
    }
    
    if (existingParticipant) {
      toast({
        title: "Already joined",
        description: "You have already joined this session",
      });
      return;
    }

    if (session.type === "online") {
      // For online sessions, set session to join and show password dialog
      setSessionToJoin(session.id);
      setSessionDetails(session);
      setShowPasswordDialog(true);
      setPasswordInput("");
    } else {
      // For offline sessions, just join
      joinSessionConfirmed(session.id);
    }
  };
  
  const joinSessionConfirmed = async (sessionId: string) => {
    try {
      // Add user as participant
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: user!.id
        });
      
      if (error) throw error;
      
      toast({
        title: "Session joined",
        description: "You have successfully joined the study session",
      });
      
      // Close password dialog if open
      setShowPasswordDialog(false);
      setSessionToJoin(null);
      setSessionDetails(null);
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: "Error",
        description: "Failed to join study session",
        variant: "destructive"
      });
    }
  };
  
  const handlePasswordSubmit = () => {
    if (!sessionDetails || !sessionToJoin) return;
    
    if (passwordInput === sessionDetails.password) {
      joinSessionConfirmed(sessionToJoin);
    } else {
      toast({
        title: "Incorrect password",
        description: "The password you entered is incorrect",
        variant: "destructive"
      });
    }
  };

  const formatSessionDate = (dateString: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const date = new Date(dateString);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center">
          <Calendar size={20} />
        </div>
        <h2 className="text-xl font-display font-semibold">Upcoming Study Sessions</h2>
      </div>
      
      {loading ? (
        <div className="text-center py-6">
          <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-sfu-red rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-gray-600">No upcoming study sessions</p>
          <p className="text-sm text-gray-500">Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {sessions.map(session => (
            <div key={session.id} className="bg-white p-4 rounded-lg hover:shadow-sm transition-all duration-200">
              <h3 className="font-medium mb-2">{session.subject}</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span>{formatSessionDate(session.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  {session.type === "online" ? (
                    <>
                      <Wifi size={16} />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={16} />
                      <span>{session.location}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users size={14} />
                  <span>{session.participants_count || 0} participants</span>
                </div>
                <div className="flex items-center gap-1">
                  {session.type === "online" && (
                    <Lock size={14} className="text-gray-400" />
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleJoinSession(session)}
                    disabled={user?.id === session.host_id}
                  >
                    {user?.id === session.host_id ? "You're the host" : "Join Session"}
                  </Button>
                </div>
              </div>
              {session.description && (
                <div className="mt-2 text-xs text-gray-600 italic">
                  "{session.description}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-white text-sfu-red hover:bg-gray-50 border border-sfu-red/20"
            disabled={!user || todayHasSession}
          >
            Create Study Session
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a New Study Session</DialogTitle>
          </DialogHeader>
          
          {todayHasSession && (
            <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
              <AlertDescription>
                You can only create one study session per day. You already have a session scheduled for today.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleCreateSession} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Session Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={newSession.subject}
                onChange={handleInputChange}
                placeholder="e.g. Calculus Group Study"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                value={newSession.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                name="description"
                value={newSession.description}
                onChange={handleInputChange}
                placeholder="Brief description of the study session"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Tabs defaultValue="offline" onValueChange={handleTypeChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="offline">
                    <Globe className="h-4 w-4 mr-2" />
                    Offline
                  </TabsTrigger>
                  <TabsTrigger value="online">
                    <Wifi className="h-4 w-4 mr-2" />
                    Online
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="offline" className="pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={newSession.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Library, Room 204"
                      required={newSession.type === "offline"}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="online" className="pt-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meeting_link">
                        Meeting Link
                        <span className="text-gray-500 ml-1 text-xs">
                          (Required for online sessions)
                        </span>
                      </Label>
                      <Input
                        id="meeting_link"
                        name="meeting_link"
                        value={newSession.meeting_link}
                        onChange={handleInputChange}
                        placeholder="e.g. https://zoom.us/j/123456789"
                        required={newSession.type === "online"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Session Password
                        <span className="text-gray-500 ml-1 text-xs">
                          (Required for online sessions)
                        </span>
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={newSession.password}
                        onChange={handleInputChange}
                        placeholder="Create a password"
                        required={newSession.type === "online"}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={todayHasSession}>Create Session</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Password dialog for joining online sessions */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Enter Session Password</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              This online study session requires a password to join. Please enter the password provided by the session host.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-password">Password</Label>
                <Input
                  id="session-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter session password"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setSessionToJoin(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handlePasswordSubmit}>
                  Join Session
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mt-6 p-4 bg-sfu-red/10 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-sfu-red/20 text-sfu-red flex items-center justify-center flex-shrink-0">
            <BookOpen size={16} />
          </div>
          <div>
            <h3 className="font-medium text-sm mb-1">Study Partner Matching</h3>
            <p className="text-xs text-gray-600 mb-2">
              Our AI-powered system can match you with compatible study partners based on your courses, learning style, and schedule.
            </p>
            <Button variant="outline" size="sm" className="text-xs w-full justify-center">Find My Perfect Match</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudySessions;
