import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { QrCode, CalendarCheck, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Redo, Copy, Star, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttendance } from "@/contexts/AttendanceContext";
import { useAuth } from "@/contexts/AuthContext";
import QRScanner from "@/components/attendance/QRScanner";
import QRCodeDisplay from "@/components/attendance/QRCodeDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Helper function to get abbreviated day of week
const getDayOfWeek = (date: Date) => {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return days[date.getDay()];
};

const Attendance = () => {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [unauthorizedAttempt, setUnauthorizedAttempt] = useState(false);

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { 
    classes, sessions, attendanceRecords, isTeacher, isLoading,
    fetchClasses, fetchSessions, fetchAttendanceRecords, 
    fetchUserAttendance, userAttendance, userEnrollments,
    fetchUserEnrollments
  } = useAttendance();

  useEffect(() => {
    if (user) {
      fetchClasses();
      if (isTeacher) {
        setViewMode('teacher');
        fetchSessions();
      } else {
        setViewMode('student');
        fetchUserAttendance();
        fetchUserEnrollments();
      }
    }
  }, [user, isTeacher]);

  // Handle tab change with authorization check
  const handleViewModeChange = (value: string) => {
    if (value === 'teacher' && !isTeacher) {
      setUnauthorizedAttempt(true);
      toast({
        title: "Access Denied",
        description: "Only teachers can access the Teacher View",
        variant: "destructive",
      });
      // Keep the student in Student View
      return;
    }
    
    setUnauthorizedAttempt(false);
    setViewMode(value as 'student' | 'teacher');
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const getNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Function to generate calendar days
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];
    const currentDate = new Date();
    
    // Header row with days of week
    const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
      <div key={`header-${day}`} className="text-center text-xs font-medium text-gray-500">
        {day}
      </div>
    ));
    
    // Empty cells for days before the first day of the month
    const emptyCells = Array.from({ length: firstDayOfMonth }).map((_, i) => (
      <div key={`empty-${i}`} className="h-8"></div>
    ));
    
    // Days of the month
    const dateCells = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = currentDate.toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      
      // Get attendance status for this day
      const hasAttendanceRecord = userAttendance?.some(record => {
        const recordDate = new Date(record.class_sessions.date);
        return recordDate.toDateString() === date.toDateString();
      });
      
      const attendanceStatus = hasAttendanceRecord 
        ? userAttendance.find(record => {
            const recordDate = new Date(record.class_sessions.date);
            return recordDate.toDateString() === date.toDateString();
          })?.status 
        : null;
      
      return (
        <div 
          key={`day-${day}`}
          className={`h-8 flex items-center justify-center rounded-full cursor-pointer
            ${isToday ? 'ring-1 ring-sfu-red' : ''}
            ${isSelected ? 'bg-sfu-red text-white' : ''}
            ${!isSelected && attendanceStatus === 'present' ? 'bg-green-100' : ''}
            ${!isSelected && attendanceStatus === 'late' ? 'bg-amber-100' : ''}
            ${!isSelected && attendanceStatus === 'absent' ? 'bg-red-100' : ''}
            ${!isSelected && attendanceStatus === 'excused' ? 'bg-blue-100' : ''}
            hover:bg-gray-100`}
          onClick={() => setSelectedDate(date)}
        >
          {day}
        </div>
      );
    });
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {dayHeaders}
        {emptyCells}
        {dateCells}
      </div>
    );
  };

  // Student view components
  const StudentView = () => {
    // Get attendance stats
    const presentCount = userAttendance?.filter(a => a.status === 'present').length || 0;
    const lateCount = userAttendance?.filter(a => a.status === 'late').length || 0;
    const absentCount = userAttendance?.filter(a => a.status === 'absent').length || 0;
    const excusedCount = userAttendance?.filter(a => a.status === 'excused').length || 0;
    const totalRecords = userAttendance?.length || 0;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
    
    // Mock streak calculation (in real app, would need proper calculation)
    const currentStreak = presentCount;
    
    // Filter today's classes
    const today = new Date();
    const todaysClasses = userEnrollments?.filter(enrollment => {
      // In a real app, you'd check if there's a session today for this class
      return true;
    });
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - Scan QR & Today's Classes */}
        <div className="space-y-6">
          {/* Scan QR Code Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Scan Attendance QR Code</h2>
              <Button 
                onClick={() => setShowQRScanner(true)}
                className="w-full bg-sfu-red hover:bg-sfu-red/90 mb-4 py-6"
              >
                <QrCode className="mr-2 h-5 w-5" />
                Scan QR Code
              </Button>
              <p className="text-sm text-gray-500 text-center">
                You must be physically present in class to mark attendance
              </p>
            </div>
          </div>
          
          {/* Today's Classes */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Today's Classes</h2>
              
              {todaysClasses && todaysClasses.length > 0 ? (
                <div className="space-y-3">
                  {todaysClasses.map((enrollment, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{enrollment.classes.name}</div>
                          <div className="text-sm text-gray-500">
                            {/* Show class time if available */}
                            10:30 AM
                          </div>
                        </div>
                        <Badge className={`${
                          index === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {index === 0 ? 'Completed' : 'Upcoming'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No classes scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Middle & Right columns - Attendance Stats & Calendar */}
        <div className="md:col-span-2 space-y-6">
          {/* Attendance Overview */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Attendance Overview</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  <div className="text-xl font-bold">{presentCount}</div>
                  <div className="text-xs text-gray-500">Present</div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <XCircle className="h-6 w-6 mx-auto mb-1 text-red-500" />
                  <div className="text-xl font-bold">{absentCount}</div>
                  <div className="text-xs text-gray-500">Absent</div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                  <div className="text-xl font-bold">{lateCount}</div>
                  <div className="text-xs text-gray-500">Late</div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Star className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  <div className="text-xl font-bold">{currentStreak}</div>
                  <div className="text-xs text-gray-500">Streak</div>
                </div>
              </div>
              
              {totalRecords > 0 && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Attendance Rate</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-sfu-red h-2.5 rounded-full" 
                      style={{ width: `${attendanceRate}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm mt-1">{attendanceRate}%</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Attendance Calendar */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Attendance Calendar</h2>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={getPrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{formatMonth(currentMonth)}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={getNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Calendar grid */}
              {renderCalendar()}
              
              {/* Legend */}
              <div className="flex justify-center mt-4 gap-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-100 mr-1"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-100 mr-1"></div>
                  <span>Late</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-100 mr-1"></div>
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Teacher view components
  const TeacherView = () => {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [attendanceList, setAttendanceList] = useState<any[]>([]);
    
    // When a class is selected, fetch its sessions
    useEffect(() => {
      if (selectedClass) {
        fetchSessions(selectedClass);
      }
    }, [selectedClass]);
    
    // When a session is selected, fetch its attendance records
    useEffect(() => {
      if (activeSessionId) {
        fetchAttendanceRecords(activeSessionId);
      }
    }, [activeSessionId]);
    
    // When attendance records are fetched, update the list
    useEffect(() => {
      if (attendanceRecords) {
        setAttendanceList(attendanceRecords);
      }
    }, [attendanceRecords]);
    
    // Find active session for attendance display
    const activeSession = sessions.find(s => s.id === activeSessionId);
    
    // Find today's sessions
    const today = new Date();
    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.toDateString() === today.toDateString();
    });
    
    const handleMarkAttendance = (studentId: string, status: string) => {
      if (activeSessionId) {
        // Update the local attendance list for immediate feedback
        setAttendanceList(prev => 
          prev.map(record => 
            record.student_id === studentId 
              ? {...record, status} 
              : record
          )
        );
      }
    };
    
    return (
      <div>
        {/* Class selection tabs */}
        <div className="mb-6">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {classes.map(cls => (
              <Button
                key={cls.id}
                variant={selectedClass === cls.id ? "default" : "outline"}
                className={`whitespace-nowrap ${selectedClass === cls.id ? "bg-sfu-red hover:bg-sfu-red/90" : ""}`}
                onClick={() => setSelectedClass(cls.id)}
              >
                {cls.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Today's Attendance Code */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Today's Attendance Code</h2>
                
                {todaySessions.length > 0 ? (
                  <div className="text-center">
                    <div className="border-2 border-gray-200 rounded-lg p-4 mb-4">
                      <QrCode className="h-40 w-40 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">
                        Code expires in: 4:56
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-2 mb-4">
                      <Button variant="outline">
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        className="bg-sfu-red hover:bg-sfu-red/90"
                        onClick={() => {
                          if (todaySessions[0]) {
                            setSelectedSession(todaySessions[0].id);
                            setShowQRCode(true);
                          }
                        }}
                      >
                        <Redo className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Students must scan this code in class to mark attendance
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No sessions scheduled for today</p>
                    <Button 
                      className="bg-sfu-red hover:bg-sfu-red/90"
                      disabled={!selectedClass}
                    >
                      Create Session
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Select Date */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Select Date</h2>
                
                <div className="flex justify-between items-center mb-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={getPrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{formatMonth(currentMonth)}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={getNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {renderCalendar()}
              </div>
            </div>
          </div>
          
          {/* Right columns - Attendance Records */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {activeSession 
                    ? `Attendance for ${new Date(activeSession.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
                    : "Select a session to view attendance"
                  }
                </h2>
                
                {selectedClass && sessions.length > 0 ? (
                  activeSessionId ? (
                    <div>
                      {attendanceList.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Check-in Time</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {attendanceList.map((record) => (
                                <TableRow key={record.id}>
                                  <TableCell>
                                    {record.profiles?.name || 'Unknown'}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                                      record.status === 'late' ? 'bg-amber-100 text-amber-800' :
                                      record.status === 'excused' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {record.status}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {record.marked_at ? new Date(record.marked_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {record.scan_method === 'qr' ? 'QR Scan' : 
                                     record.scan_method === 'manual' ? 'Manual' : 'System'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant={record.status === 'present' ? "default" : "outline"}
                                        className="text-xs py-0 h-7"
                                        onClick={() => handleMarkAttendance(record.student_id, 'present')}
                                      >
                                        Present
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={record.status === 'late' ? "default" : "outline"}
                                        className="text-xs py-0 h-7"
                                        onClick={() => handleMarkAttendance(record.student_id, 'late')}
                                      >
                                        Late
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={record.status === 'absent' ? "default" : "outline"}
                                        className="text-xs py-0 h-7"
                                        onClick={() => handleMarkAttendance(record.student_id, 'absent')}
                                      >
                                        Absent
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <p>No attendance records found for this session</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-500 mb-4">Select a session to view attendance:</p>
                      {sessions.map(session => (
                        <div 
                          key={session.id}
                          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-sfu-red"
                          onClick={() => setActiveSessionId(session.id)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">
                                {new Date(session.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSession(session.id);
                                setShowQRCode(true);
                              }}
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              Generate QR
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>{selectedClass ? "No sessions found for this class" : "Select a class to view sessions"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Attendance Management</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Secure and efficient attendance tracking with QR codes. Scan the code in your class to mark your attendance.
            </p>
          </div>

          {unauthorizedAttempt && (
            <Alert variant="destructive" className="mb-6">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don't have permission to access the Teacher View. Only verified teachers can access this section.
              </AlertDescription>
            </Alert>
          )}

          <Tabs 
            defaultValue={isTeacher ? "teacher" : "student"} 
            value={viewMode}
            onValueChange={handleViewModeChange}
            className="mb-8"
          >
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="student">Student View</TabsTrigger>
                <TabsTrigger value="teacher" disabled={!isTeacher}>Teacher View</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="student">
              <StudentView />
            </TabsContent>
            <TabsContent value="teacher">
              {isTeacher ? (
                <TeacherView />
              ) : (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-sfu-red" />
                  <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                  <p className="text-gray-600 mb-4">
                    The Teacher View is only accessible to authorized teachers. 
                    As a student, you can use the Student View to scan attendance QR codes and view your own attendance records.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRScanner 
          sessionId={selectedSession || 'demo-session-id'}
          onSuccess={() => {
            setShowQRScanner(false);
            fetchUserAttendance();
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
      
      {/* QR Code Display Modal */}
      {showQRCode && selectedSession && (
        <QRCodeDisplay 
          sessionId={selectedSession}
          onClose={() => setShowQRCode(false)}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default Attendance;
