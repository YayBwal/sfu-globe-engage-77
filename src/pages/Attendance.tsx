
import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { QrCode, CalendarCheck, CheckCircle, XCircle, Clock, BarChart, 
  Calendar, ChevronLeft, ChevronRight, Plus, Users, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttendance } from "@/contexts/AttendanceContext";
import { useAuth } from "@/contexts/AuthContext";
import QRScanner from "@/components/attendance/QRScanner";
import QRCodeDisplay from "@/components/attendance/QRCodeDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Attendance = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false);
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({name: "", description: ""});
  const [newSession, setNewSession] = useState({date: "", location: ""});
  
  const { user, profile } = useAuth();
  const { 
    classes, sessions, attendanceRecords, isTeacher, isLoading,
    fetchClasses, fetchSessions, fetchAttendanceRecords, createClass, 
    createSession, markAttendance, fetchUserAttendance, userAttendance,
    fetchUserEnrollments, userEnrollments
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Function to get attendance status for a calendar day
  const getDayStatus = (day: number): string | null => {
    if (!userAttendance || userAttendance.length === 0) return null;
    
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
    
    // Find attendance records for this date
    const record = userAttendance.find(att => {
      const attDate = new Date(att.class_sessions.date).toISOString().split('T')[0];
      return attDate === dateStr;
    });
    
    return record ? record.status : null;
  };

  // Generate calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      const status = getDayStatus(day);
      
      days.push(
        <div 
          key={day} 
          className={`h-10 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 ${
            isToday ? 'border border-sfu-red' : ''
          } ${
            isSelected ? 'bg-sfu-red text-white' : ''
          } ${
            status === 'present' ? 'bg-green-100' : 
            status === 'late' ? 'bg-yellow-100' : 
            status === 'absent' ? 'bg-red-100' : ''
          } hover:bg-gray-100`}
          onClick={() => setSelectedDate(date)}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  const handleCreateClass = async () => {
    if (newClass.name.trim() === "") return;
    
    await createClass(newClass);
    setNewClass({name: "", description: ""});
    setShowCreateClassDialog(false);
  };

  const handleCreateSession = async () => {
    if (!selectedClass || !newSession.date) return;
    
    await createSession({
      class_id: selectedClass,
      date: new Date(newSession.date).toISOString(),
      location: newSession.location,
      status: "scheduled"
    });
    
    setNewSession({date: "", location: ""});
    setShowCreateSessionDialog(false);
  };

  const handleOpenQRCode = (sessionId: string) => {
    setSelectedSession(sessionId);
    setShowQRCode(true);
  };

  const handleOpenQRScanner = (sessionId: string) => {
    setSelectedSession(sessionId);
    setShowQRScanner(true);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    fetchSessions(classId);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container-narrow max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Attendance Tracking</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Keep track of your class attendance, view statistics, and maintain your perfect attendance streak.
            </p>
          </div>

          {isTeacher ? (
            // Teacher View
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Teacher Management Panel */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-sfu-black text-white p-4">
                    <h2 className="font-display font-semibold">Teacher Panel</h2>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <Button 
                      onClick={() => setShowCreateClassDialog(true)}
                      className="w-full flex items-center gap-2 bg-sfu-red hover:bg-sfu-red/90"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Class
                    </Button>
                    
                    {classes.length > 0 && (
                      <Button 
                        onClick={() => setShowCreateSessionDialog(true)}
                        className="w-full flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Create Class Session
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-sfu-black text-white p-4">
                    <h2 className="font-display font-semibold">Your Classes</h2>
                  </div>
                  
                  <div className="p-4">
                    {classes.length > 0 ? (
                      <div className="space-y-3">
                        {classes.map(cls => (
                          <div 
                            key={cls.id} 
                            className={`p-3 border rounded-lg cursor-pointer ${
                              selectedClass === cls.id ? 'border-sfu-red bg-sfu-red/5' : 'border-gray-200'
                            }`}
                            onClick={() => handleClassChange(cls.id)}
                          >
                            <div className="font-medium">{cls.name}</div>
                            {cls.description && (
                              <div className="text-sm text-gray-500">{cls.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <School className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                        <p>No classes created yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Sessions and Attendance */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                  <div className="bg-sfu-red text-white p-4">
                    <h2 className="font-display font-semibold">Class Sessions</h2>
                  </div>
                  
                  <div className="p-4">
                    {sessions.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Class</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sessions.map(session => (
                              <TableRow key={session.id}>
                                <TableCell>{session.classes.name}</TableCell>
                                <TableCell>
                                  {new Date(session.date).toLocaleDateString()}<br/>
                                  <span className="text-xs text-gray-500">
                                    {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </TableCell>
                                <TableCell>{session.location || 'N/A'}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    session.status === 'in-progress' ? 'bg-green-100 text-green-800' :
                                    session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {session.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSession(session.id);
                                        fetchAttendanceRecords(session.id);
                                        setShowAttendanceDialog(true);
                                      }}
                                    >
                                      <Users className="h-4 w-4 mr-1" />
                                      Attendance
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-sfu-red hover:bg-sfu-red/90"
                                      onClick={() => handleOpenQRCode(session.id)}
                                    >
                                      <QrCode className="h-4 w-4 mr-1" />
                                      QR Code
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No sessions found</p>
                        {!selectedClass && classes.length > 0 && (
                          <p className="mt-2 text-sm">Select a class from the sidebar to view its sessions</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Student View
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Attendance Stats */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-sfu-black text-white p-4">
                    <h2 className="font-display font-semibold">Attendance Overview</h2>
                  </div>
                  
                  <div className="p-6">
                    {userAttendance.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-sfu-lightgray p-4 rounded-lg text-center">
                            <div className="text-gray-500 text-sm mb-1">Attendance Rate</div>
                            <div className="text-3xl font-bold text-sfu-black">
                              {Math.round((userAttendance.filter(a => a.status === 'present').length / userAttendance.length) * 100)}%
                            </div>
                          </div>
                          
                          <div className="bg-sfu-lightgray p-4 rounded-lg text-center">
                            <div className="text-gray-500 text-sm mb-1">Current Streak</div>
                            <div className="text-3xl font-bold text-sfu-black">
                              {/* Calculate streak logic would go here */}
                              {userAttendance.filter(a => a.status === 'present').length} days
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle size={18} className="text-green-500" />
                              <span>Present</span>
                            </div>
                            <div className="font-bold">{userAttendance.filter(a => a.status === 'present').length}</div>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <XCircle size={18} className="text-red-500" />
                              <span>Absent</span>
                            </div>
                            <div className="font-bold">{userAttendance.filter(a => a.status === 'absent').length}</div>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Clock size={18} className="text-yellow-500" />
                              <span>Late</span>
                            </div>
                            <div className="font-bold">{userAttendance.filter(a => a.status === 'late').length}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No attendance records yet</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-sfu-black text-white p-4">
                    <h2 className="font-display font-semibold">Today's Classes</h2>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {userEnrollments.length > 0 ? (
                      userEnrollments.map(enrollment => (
                        <div key={enrollment.id} className="p-3 border border-gray-200 bg-white rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{enrollment.classes.name}</div>
                              <div className="text-xs text-gray-500">
                                Teacher: {enrollment.classes.profiles?.name || 'Unknown'}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              className="text-xs bg-sfu-red hover:bg-sfu-red/90"
                              onClick={() => {
                                // In a real app, you would get active sessions for this class
                                // For demo, we'll just show the QR scanner
                                handleOpenQRScanner("demo-session-id");
                              }}
                            >
                              <QrCode className="h-3 w-3 mr-1" />
                              Check In
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <School className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>You are not enrolled in any classes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Calendar */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-sfu-black text-white p-4 flex justify-between items-center">
                    <h2 className="font-display font-semibold">Attendance Calendar</h2>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                        onClick={getPrevMonth}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      
                      <div className="text-sm">{formatDate(currentMonth)}</div>
                      
                      <button 
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                        onClick={getNextMonth}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-6">
                      {renderCalendar()}
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-100"></div>
                        <span>Present</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-100"></div>
                        <span>Late</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-100"></div>
                        <span>Absent</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-sfu-red text-white p-4">
                    <h2 className="font-display font-semibold">Recent Attendance</h2>
                  </div>
                  
                  <div className="p-4">
                    {userAttendance.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Class</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Method</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userAttendance.slice(0, 5).map(record => (
                              <TableRow key={record.id}>
                                <TableCell>{record.class_sessions.classes.name}</TableCell>
                                <TableCell>
                                  {new Date(record.class_sessions.date).toLocaleDateString()}<br/>
                                  <span className="text-xs text-gray-500">
                                    {new Date(record.class_sessions.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                    record.status === 'excused' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {record.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs">
                                    {record.scan_method === 'qr' ? 'QR Scan' : 
                                     record.scan_method === 'manual' ? 'Manual' : 'Auto'}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No attendance records found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* QR Code Scanner Modal */}
      {showQRScanner && selectedSession && (
        <QRScanner 
          sessionId={selectedSession}
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
      
      {/* Create Class Dialog */}
      <Dialog open={showCreateClassDialog} onOpenChange={setShowCreateClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Create a new class to manage attendance for students.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name *</Label>
              <Input 
                id="class-name" 
                placeholder="e.g. Computer Science 101"
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class-description">Description (Optional)</Label>
              <Textarea 
                id="class-description" 
                placeholder="Class description or additional information"
                value={newClass.description}
                onChange={(e) => setNewClass({...newClass, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateClassDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClass}>
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Session Dialog */}
      <Dialog open={showCreateSessionDialog} onOpenChange={setShowCreateSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Class Session</DialogTitle>
            <DialogDescription>
              Schedule a new session for one of your classes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-class">Class *</Label>
              <select 
                id="session-class"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedClass || ""}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select a class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session-date">Date and Time *</Label>
              <Input 
                id="session-date" 
                type="datetime-local"
                value={newSession.date}
                onChange={(e) => setNewSession({...newSession, date: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session-location">Location (Optional)</Label>
              <Input 
                id="session-location" 
                placeholder="e.g. Room 101, Building A"
                value={newSession.location}
                onChange={(e) => setNewSession({...newSession, location: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSessionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSession}>
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Attendance Management Dialog */}
      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Attendance</DialogTitle>
            <DialogDescription>
              View and update attendance for this session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {attendanceRecords.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marked At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell>{record.profiles?.name || 'Unknown'}</TableCell>
                        <TableCell>{record.profiles?.student_id || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'excused' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(record.marked_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {['present', 'late', 'absent', 'excused'].map(status => (
                              <Button
                                key={status}
                                size="sm"
                                variant={record.status === status ? "default" : "outline"}
                                className={`text-xs px-2 ${
                                  record.status === status ? "opacity-100" : "opacity-60"
                                }`}
                                onClick={() => {
                                  if (selectedSession) {
                                    markAttendance(selectedSession, record.student_id, status);
                                  }
                                }}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No attendance records found for this session</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowAttendanceDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Attendance;
