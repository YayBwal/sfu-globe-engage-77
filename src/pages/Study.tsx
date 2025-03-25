import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

// Import components
import StudentSearch from "@/components/study/StudentSearch";
import StudentProfile from "@/components/study/StudentProfile";
import MessagingPanel from "@/components/study/MessagingPanel";
import StudySessions from "@/components/study/StudySessions";
import PartnerMatching from "@/components/study/PartnerMatching";

// Define types for study sessions
export type StudySession = {
  id: string;
  subject: string;
  date: string;
  location: string;
  type: "online" | "offline";
  participants?: number;
  participants_count?: number;
  host_id: string;
  password?: string;
  meeting_link?: string;
  description?: string;
};

const Study = () => {
  const [activeTab, setActiveTab] = useState("sessions");
  const [studentIdLookup, setStudentIdLookup] = useState("");
  const [matchedStudents, setMatchedStudents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [connections, setConnections] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<{[key: string]: {text: string, sender: string, timestamp: Date}[]}>({});
  const [showMessaging, setShowMessaging] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Load connections from Supabase on component mount
  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchPendingRequests();
      fetchMessages();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;
    
    try {
      // Get all accepted connections where the user is either the sender or receiver
      const { data, error } = await supabase
        .from('connections')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Extract the IDs of the connected users (excluding the current user)
        const connectionIds = data.map(conn => 
          conn.user_id === user.id ? conn.friend_id : conn.user_id
        );
        
        setConnections(connectionIds);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  };
  
  const fetchPendingRequests = async () => {
    if (!user) return;
    
    try {
      // Get all pending connection requests sent by the current user
      const { data, error } = await supabase
        .from('connections')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'pending');
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setPendingRequests(data.map(req => req.friend_id));
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };
  
  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      // Get messages where the user is either the sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Group messages by conversation
        const messagesByConversation: {[key: string]: {text: string, sender: string, timestamp: Date}[]} = {};
        
        data.forEach(msg => {
          // Determine the conversation partner
          const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          
          if (!messagesByConversation[partnerId]) {
            messagesByConversation[partnerId] = [];
          }
          
          messagesByConversation[partnerId].push({
            text: msg.text,
            sender: msg.sender_id,
            timestamp: new Date(msg.created_at)
          });
        });
        
        setMessages(messagesByConversation);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const findStudentById = async () => {
    if (!studentIdLookup.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a student ID to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSelectedStudent(null);
    setShowMessaging(false);
    
    try {
      // Search for students by ID or name
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`student_id.ilike.%${studentIdLookup}%,name.ilike.%${studentIdLookup}%`);
        
      if (error) {
        throw error;
      }
      
      // Filter out the current user
      const filteredResults = data.filter(student => student.id !== user?.id);
      
      setMatchedStudents(filteredResults.map(student => ({
        id: student.id,
        name: student.name,
        studentId: student.student_id,
        major: student.major,
        batch: student.batch,
        online: student.online,
        bio: student.bio,
        interests: student.interests || [],
        availability: student.availability,
      })));
      
      setIsSearching(false);
      
      if (filteredResults.length === 0) {
        toast({
          title: "No matches found",
          description: "No students match the provided ID or name",
        });
      } else {
        toast({
          title: "Students found",
          description: `Found ${filteredResults.length} student(s) matching your search`,
        });
      }
    } catch (error) {
      setIsSearching(false);
      console.error("Error searching for students:", error);
      toast({
        title: "Search error",
        description: "An error occurred while searching for students",
        variant: "destructive",
      });
    }
  };

  const viewStudentProfile = (student: any) => {
    setSelectedStudent(student);
    setShowMessaging(false);
    setActiveTab("profile");
  };
  
  const sendConnectionRequest = async (studentId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to connect with other students",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Insert the connection request
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          friend_id: studentId,
          status: 'pending'
        });
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setPendingRequests(prev => [...prev, studentId]);
      
      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent",
      });
      
      // For demo purposes, auto-accept after 2 seconds
      setTimeout(() => {
        acceptConnection(studentId);
      }, 2000);
      
      // Add activity
      addActivity('friend_add', { friend_id: studentId });
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Request failed",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };
  
  const acceptConnection = async (studentId: string) => {
    if (!user) return;
    
    try {
      // Find and update the connection request
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('user_id', user.id)
        .eq('friend_id', studentId);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setPendingRequests(prev => prev.filter(id => id !== studentId));
      setConnections(prev => [...prev, studentId]);
      
      toast({
        title: "Connection accepted",
        description: "You are now connected",
      });
    } catch (error) {
      console.error("Error accepting connection:", error);
    }
  };
  
  const removeConnection = async (studentId: string) => {
    if (!user) return;
    
    try {
      // Delete the connection in both directions
      await supabase
        .from('connections')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${studentId}),and(user_id.eq.${studentId},friend_id.eq.${user.id})`);
      
      // Update local state
      setConnections(prev => prev.filter(id => id !== studentId));
      
      toast({
        title: "Connection removed",
        description: "Connection has been removed",
      });
    } catch (error) {
      console.error("Error removing connection:", error);
      toast({
        title: "Error",
        description: "Failed to remove connection",
        variant: "destructive",
      });
    }
  };
  
  const openMessaging = (student: any) => {
    setSelectedStudent(student);
    setShowMessaging(true);
    setActiveTab("messaging");
    
    // Initialize messages array if it doesn't exist
    if (!messages[student.id]) {
      setMessages(prev => ({ ...prev, [student.id]: [] }));
    }
  };
  
  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedStudent || !user) return;
    
    try {
      // Store message in the database
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedStudent.id,
          text: text
        });
        
      if (error) {
        throw error;
      }
      
      // Update local state
      const newMessage = {
        text: text,
        sender: user.id,
        timestamp: new Date()
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedStudent.id]: [...(prev[selectedStudent.id] || []), newMessage]
      }));
      
      // Simulate a reply after 2 seconds
      setTimeout(async () => {
        const replies = [
          "Sure, that works for me!",
          "When would you like to meet?",
          "Thanks for reaching out!",
          "I'm also studying for that exam.",
          "Let's meet at the library.",
          "I have class until 3pm, can we meet after?",
          "That's a great idea!",
        ];
        
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        // Store the reply in the database
        await supabase
          .from('messages')
          .insert({
            sender_id: selectedStudent.id,
            receiver_id: user.id,
            text: randomReply
          });
        
        const replyMessage = {
          text: randomReply,
          sender: selectedStudent.id,
          timestamp: new Date()
        };
        
        setMessages(prev => ({
          ...prev,
          [selectedStudent.id]: [...(prev[selectedStudent.id] || []), replyMessage]
        }));
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Message failed",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const addActivity = async (type: string, detail: any) => {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user?.id,
          activity_type: type,
          activity_detail: detail
        });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };
  
  const isConnected = (studentId: string) => {
    return connections.includes(studentId);
  };
  
  const isPendingConnection = (studentId: string) => {
    return pendingRequests.includes(studentId);
  };

  const handleBack = () => {
    setSelectedStudent(null);
    setShowMessaging(false);
    setActiveTab("sessions");
  };

  // Convert our mock data to match the StudySession type
  const upcomingSessionsData: StudySession[] = [
    {
      id: "1",
      subject: "Algorithm Analysis",
      date: "2023-05-15T18:00:00",
      location: "Library, Room 302",
      host_id: "user-1",
      type: "offline"
    },
    {
      id: "2",
      subject: "Database Systems",
      date: "2023-05-16T15:30:00",
      location: "Online",
      host_id: "user-2",
      type: "online",
      password: "db123",
      meeting_link: "https://zoom.us/j/123456789"
    },
    {
      id: "3",
      subject: "Mobile Development",
      date: "2023-05-17T10:00:00",
      location: "Computer Lab 4",
      host_id: "user-3",
      type: "offline"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container-narrow max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Find Your Study Buddy</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Connect with fellow students based on your courses, learning style, and location to enhance your academic journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student ID Finder */}
            <StudentSearch 
              studentIdLookup={studentIdLookup}
              setStudentIdLookup={setStudentIdLookup}
              onSearch={findStudentById}
              isSearching={isSearching}
              matchedStudents={matchedStudents}
              onViewProfile={viewStudentProfile}
              onSendConnectionRequest={sendConnectionRequest}
              onOpenMessaging={openMessaging}
              onRemoveConnection={removeConnection}
              isConnected={isConnected}
              isPendingConnection={isPendingConnection}
              connections={connections}
              user={profile}
            />
            
            {/* Right Side: Content Tabs */}
            <div className="bg-sfu-lightgray p-6 rounded-xl">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="matching">Match AI</TabsTrigger>
                  {(showMessaging || selectedStudent) && (
                    <TabsTrigger value={showMessaging ? "messaging" : "profile"}>
                      {showMessaging ? "Messages" : "Profile"}
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="sessions">
                  <StudySessions upcomingSessions={upcomingSessionsData} />
                </TabsContent>
                
                <TabsContent value="matching">
                  <PartnerMatching onViewProfile={viewStudentProfile} />
                </TabsContent>
                
                <TabsContent value="messaging">
                  {showMessaging && selectedStudent && (
                    <MessagingPanel 
                      student={selectedStudent}
                      onBack={handleBack}
                      messages={messages[selectedStudent.id] || []}
                      onSendMessage={sendMessage}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="profile">
                  {selectedStudent && !showMessaging && (
                    <StudentProfile 
                      student={selectedStudent}
                      onBack={handleBack}
                      onOpenMessaging={openMessaging}
                      onSendConnectionRequest={sendConnectionRequest}
                      isConnected={isConnected}
                      isPendingConnection={isPendingConnection}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Study;
