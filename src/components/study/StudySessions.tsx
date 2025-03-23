
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, BookOpen, Clock, Calendar, Wifi, Lock, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudySession {
  id: number;
  subject: string;
  date: string;
  location: string;
  participants: number;
  type: "online" | "offline";
  password?: string;
  hostId: string;
}

interface StudySessionsProps {
  upcomingSessions: StudySession[];
}

const StudySessions: React.FC<StudySessionsProps> = ({ upcomingSessions }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newSession, setNewSession] = useState({
    subject: "",
    date: "",
    location: "",
    type: "offline" as "online" | "offline",
    password: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSession(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setNewSession(prev => ({ 
      ...prev, 
      type: value as "online" | "offline",
      // Clear password if type is offline
      password: value === "offline" ? "" : prev.password
    }));
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to create a study session",
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

    // For online sessions, validate password
    if (newSession.type === "online" && !newSession.password) {
      toast({
        title: "Password required",
        description: "Online sessions require a password",
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

    // In a real app, this would send the data to a backend
    // For now, we'll just show a success message
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
      password: ""
    });
  };

  const handleJoinSession = (session: StudySession) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to join a study session",
        variant: "destructive"
      });
      return;
    }

    if (session.type === "online") {
      // For online sessions, prompt for password
      const password = prompt("Enter the session password:");
      if (password === session.password) {
        toast({
          title: "Session joined",
          description: `You have joined ${session.subject}`,
        });
      } else {
        toast({
          title: "Incorrect password",
          description: "The password you entered is incorrect",
          variant: "destructive"
        });
      }
    } else {
      // For offline sessions, just join
      toast({
        title: "Session joined",
        description: `You have joined ${session.subject} at ${session.location}`,
      });
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
      
      <div className="space-y-4 mb-6">
        {upcomingSessions.map(session => (
          <div key={session.id} className="bg-white p-4 rounded-lg hover:shadow-sm transition-all duration-200">
            <h3 className="font-medium mb-2">{session.subject}</h3>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} />
                <span>{session.date}</span>
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
                <span>{session.participants} participants</span>
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
                >
                  Join Session
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full bg-white text-sfu-red hover:bg-gray-50 border border-sfu-red/20">
            Create Study Session
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a New Study Session</DialogTitle>
          </DialogHeader>
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
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create Session</Button>
            </div>
          </form>
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
