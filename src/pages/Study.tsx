
import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Import components
import StudentSearch from "@/components/study/StudentSearch";
import StudentProfile from "@/components/study/StudentProfile";
import MessagingPanel from "@/components/study/MessagingPanel";
import StudySessions from "@/components/study/StudySessions";
import PartnerMatching from "@/components/study/PartnerMatching";

// Import data
import { allStudentsData, upcomingSessions } from "@/data/StudyData";

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
  const { user } = useAuth();
  const { toast } = useToast();

  // Load connections from localStorage on component mount
  useEffect(() => {
    const savedConnections = localStorage.getItem("connections");
    if (savedConnections) {
      setConnections(JSON.parse(savedConnections));
    }
    
    const savedPendingRequests = localStorage.getItem("pendingRequests");
    if (savedPendingRequests) {
      setPendingRequests(JSON.parse(savedPendingRequests));
    }
    
    const savedMessages = localStorage.getItem("messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save connections to localStorage whenever they change
  useEffect(() => {
    if (connections.length > 0) {
      localStorage.setItem("connections", JSON.stringify(connections));
    }
  }, [connections]);
  
  // Save pending requests to localStorage whenever they change
  useEffect(() => {
    if (pendingRequests.length > 0) {
      localStorage.setItem("pendingRequests", JSON.stringify(pendingRequests));
    }
  }, [pendingRequests]);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(messages).length > 0) {
      localStorage.setItem("messages", JSON.stringify(messages));
    }
  }, [messages]);

  const findStudentById = () => {
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
    
    // Search for students matching the ID
    setTimeout(() => {
      const results = allStudentsData.filter(student => 
        student.studentId.toLowerCase().includes(studentIdLookup.toLowerCase()) ||
        student.name.toLowerCase().includes(studentIdLookup.toLowerCase())
      );
      
      setMatchedStudents(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "No matches found",
          description: "No students match the provided ID or name",
        });
      } else {
        toast({
          title: "Students found",
          description: `Found ${results.length} student(s) matching your search`,
        });
      }
    }, 800);
  };

  const viewStudentProfile = (student: any) => {
    setSelectedStudent(student);
    setShowMessaging(false);
    setActiveTab("profile");
  };
  
  const sendConnectionRequest = (studentId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to connect with other students",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would send a request to the backend
    // For demo purposes, we'll just add it to pendingRequests
    setPendingRequests(prev => [...prev, studentId]);
    
    toast({
      title: "Connection request sent",
      description: `Your connection request has been sent to student ID: ${studentId}`,
    });
    
    // For demo purposes, auto-accept after 2 seconds
    setTimeout(() => {
      acceptConnection(studentId);
    }, 2000);
  };
  
  const acceptConnection = (studentId: string) => {
    // Add to connections list
    setConnections(prev => [...prev, studentId]);
    // Remove from pending requests
    setPendingRequests(prev => prev.filter(id => id !== studentId));
    
    toast({
      title: "Connection accepted",
      description: `You are now connected with student ID: ${studentId}`,
    });
  };
  
  const removeConnection = (studentId: string) => {
    setConnections(prev => prev.filter(id => id !== studentId));
    
    toast({
      title: "Connection removed",
      description: `You have removed the connection with student ID: ${studentId}`,
    });
  };
  
  const openMessaging = (student: any) => {
    setSelectedStudent(student);
    setShowMessaging(true);
    setActiveTab("messaging");
    
    // Initialize messages array if it doesn't exist
    if (!messages[student.studentId]) {
      setMessages(prev => ({ ...prev, [student.studentId]: [] }));
    }
  };
  
  const sendMessage = (text: string) => {
    if (!text.trim() || !selectedStudent) return;
    
    const newMessage = {
      text: text,
      sender: "me",
      timestamp: new Date()
    };
    
    setMessages(prev => ({
      ...prev,
      [selectedStudent.studentId]: [...(prev[selectedStudent.studentId] || []), newMessage]
    }));
    
    // Simulate a reply after 2 seconds
    setTimeout(() => {
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
      
      const replyMessage = {
        text: randomReply,
        sender: selectedStudent.studentId,
        timestamp: new Date()
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedStudent.studentId]: [...(prev[selectedStudent.studentId] || []), replyMessage]
      }));
    }, 2000);
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
              user={user}
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
                  <StudySessions upcomingSessions={upcomingSessions} />
                </TabsContent>
                
                <TabsContent value="matching">
                  <PartnerMatching onViewProfile={viewStudentProfile} />
                </TabsContent>
                
                <TabsContent value="messaging">
                  {showMessaging && selectedStudent && (
                    <MessagingPanel 
                      student={selectedStudent}
                      onBack={handleBack}
                      messages={messages[selectedStudent.studentId] || []}
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
