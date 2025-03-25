
import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { QrCode, CalendarCheck, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Redo, Copy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttendance } from "@/contexts/AttendanceContext";
import { useAuth } from "@/contexts/AuthContext";
import QRScanner from "@/components/attendance/QRScanner";
import QRCodeDisplay from "@/components/attendance/QRCodeDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

// Helper function to get abbreviated day of week
const getDayOfWeek = (date: Date) => {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return days[date.getDay()];
};

const Attendance = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);

  const { user, profile } = useAuth();
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
        fetchSessions();
      } else {
        fetchUserAttendance();
        fetchUserEnrollments();
      }
    }
  }, [user, isTeacher]);

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
          <motion.div 
            className="bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Scan Attendance QR Code</h2>
              <AnimatePresence mode="wait">
                {scanComplete ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center p-4 bg-green-50 rounded-lg mb-4"
                  >
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="font-medium text-green-700">Attendance Marked!</p>
                    <p className="text-sm text-green-600">You've been marked present for today's class</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => setScanComplete(false)}
                    >
                      Scan Another Code
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Button 
                      onClick={() => setShowQRScanner(true)}
                      className="w-full bg-sfu-red hover:bg-sfu-red/90 mb-4 py-6"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <QrCode className="mr-2 h-5 w-5" />
                      Scan QR Code
                    </Button>
                    <p className="text-sm text-gray-500 text-center">
                      You must be physically present in class to mark attendance
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* Today's Classes */}
          <motion.div 
            className="bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Today's Classes</h2>
              
              {todaysClasses && todaysClasses.length > 0 ? (
                <div className="space-y-3">
                  {todaysClasses.map((enrollment, index) => (
                    <motion.div 
                      key={index} 
                      className="p-3 border border-gray-200 rounded-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    >
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
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No classes scheduled for today</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Middle & Right columns - Attendance Stats & Calendar */}
        <div className="md:col-span-2 space-y-6">
          {/* Attendance Overview */}
          <motion.div 
            className="bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Attendance Overview</h2>
              <div className="grid grid-cols-4 gap-4">
                <motion.div 
                  className="bg-green-50 rounded-lg p-4 text-center"
                  whileHover={{ scale: 1.05 }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  <div className="text-xl font-bold">{presentCount}</div>
                  <div className="text-xs text-gray-500">Present</div>
                </motion.div>
                
                <motion.div 
                  className="bg-red-50 rounded-lg p-4 text-center"
                  whileHover={{ scale: 1.05 }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <XCircle className="h-6 w-6 mx-auto mb-1 text-red-500" />
                  <div className="text-xl font-bold">{absentCount}</div>
                  <div className="text-xs text-gray-500">Absent</div>
                </motion.div>
                
                <motion.div 
                  className="bg-amber-50 rounded-lg p-4 text-center"
                  whileHover={{ scale: 1.05 }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Clock className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                  <div className="text-xl font-bold">{lateCount}</div>
                  <div className="text-xs text-gray-500">Late</div>
                </motion.div>
                
                <motion.div 
                  className="bg-blue-50 rounded-lg p-4 text-center"
                  whileHover={{ scale: 1.05 }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Star className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  <div className="text-xl font-bold">{currentStreak}</div>
                  <div className="text-xs text-gray-500">Streak</div>
                </motion.div>
              </div>
              
              {totalRecords > 0 && (
                <motion.div 
                  className="mt-4 bg-gray-50 rounded-lg p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-sm font-medium text-gray-700 mb-2">Attendance Rate</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <motion.div 
                      className="bg-sfu-red h-2.5 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${attendanceRate}%` }}
                      transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                    ></motion.div>
                  </div>
                  <div className="text-right text-sm mt-1">{attendanceRate}%</div>
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* Attendance Calendar */}
          <motion.div 
            className="bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Attendance Calendar</h2>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={getPrevMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{formatMonth(currentMonth)}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={getNextMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Calendar grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {renderCalendar()}
              </motion.div>
              
              {/* Legend */}
              <div className="flex justify-center mt-4 gap-x-4 text-xs">
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="w-3 h-3 rounded-full bg-green-100 mr-1"></div>
                  <span>Present</span>
                </motion.div>
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-3 h-3 rounded-full bg-amber-100 mr-1"></div>
                  <span>Late</span>
                </motion.div>
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="w-3 h-3 rounded-full bg-red-100 mr-1"></div>
                  <span>Absent</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
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
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex overflow-x-auto gap-2 pb-2">
            {classes.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={selectedClass === cls.id ? "default" : "outline"}
                  className={`whitespace-nowrap ${selectedClass === cls.id ? "bg-sfu-red hover:bg-sfu-red/90" : ""}`}
                  onClick={() => setSelectedClass(cls.id)}
                >
                  {cls.name}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Today's Attendance Code */}
          <div className="space-y-6">
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Today's Attendance Code</h2>
                
                {todaySessions.length > 0 ? (
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      className="border-2 border-gray-200 rounded-lg p-4 mb-4 relative"
                      whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <QrCode className="h-40 w-40 mx-auto mb-2" />
                      <motion.div 
                        className="absolute inset-0 bg-black/5 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                        whileHover={{ opacity: 1 }}
                      >
                        <Button
                          className="bg-sfu-red hover:bg-sfu-red/90"
                          onClick={() => {
                            if (todaySessions[0]) {
                              setSelectedSession(todaySessions[0].id);
                              setShowQRCode(true);
                            }
                          }}
                        >
                          Generate QR Code
                        </Button>
                      </motion.div>
                      <div className="text-sm text-gray-500">
                        Click to generate a new QR code
                      </div>
                    </motion.div>
                    
                    <div className="flex justify-center gap-2 mb-4">
                      <Button 
                        variant="outline"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        className="bg-sfu-red hover:bg-sfu-red/90"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
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
                    
                    <motion.p 
                      className="text-sm text-gray-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Students must scan this code in class to mark attendance
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="text-center py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-gray-500 mb-4">No sessions scheduled for today</p>
                    <Button 
                      className="bg-sfu-red hover:bg-sfu-red/90"
                      disabled={!selectedClass}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Create Session
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            {/* Select Date */}
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Select Date</h2>
                
                <div className="flex justify-between items-center mb-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={getPrevMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{formatMonth(currentMonth)}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={getNextMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {renderCalendar()}
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          {/* Right columns - Attendance Records */}
          <div className="md:col-span-2">
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
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
                        <motion.div 
                          className="overflow-hidden rounded-lg border border-gray-200"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
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
                              {attendanceList.map((record, index) => (
                                <motion.tr 
                                  key={record.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-gray-50"
                                >
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
                                </motion.tr>
                              ))}
                            </TableBody>
                          </Table>
                        </motion.div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <p>No attendance records found for this session</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-500 mb-4">Select a session to view attendance:</p>
                      {sessions.map((session, index) => (
                        <motion.div 
                          key={session.id}
                          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-sfu-red"
                          onClick={() => setActiveSessionId(session.id)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ 
                            scale: 1.02, 
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            borderColor: "#A6192E" 
                          }}
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
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              Generate QR
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>{selectedClass ? "No sessions found for this class" : "Select a class to view sessions"}</p>
                  </div>
                )}
              </div>
            </motion.div>
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
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Attendance Management</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Secure and efficient attendance tracking with QR codes. Scan the code in your class to mark your attendance.
            </p>
          </motion.div>

          <div className="mb-8">
            {isTeacher ? (
              <div>
                <TeacherView />
              </div>
            ) : (
              <div>
                <StudentView />
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRScanner 
          sessionId={selectedSession || 'demo-session-id'}
          onSuccess={() => {
            setShowQRScanner(false);
            fetchUserAttendance();
            setScanComplete(true);
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
