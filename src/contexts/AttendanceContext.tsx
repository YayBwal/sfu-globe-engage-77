
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type AttendanceContextType = {
  classes: any[];
  sessions: any[];
  attendanceRecords: any[];
  enrollments: any[];
  isTeacher: boolean;
  isLoading: boolean;
  generateQRCode: (sessionId: string) => Promise<string | null>;
  verifyAttendance: (sessionId: string, qrCode: string, location?: { lat: number, lng: number }) => Promise<boolean>;
  fetchClasses: () => Promise<void>;
  fetchSessions: (classId?: string) => Promise<void>;
  fetchAttendanceRecords: (sessionId?: string) => Promise<void>;
  createClass: (classData: any) => Promise<any>;
  createSession: (sessionData: any) => Promise<any>;
  markAttendance: (sessionId: string, studentId: string, status: string, notes?: string) => Promise<boolean>;
  fetchUserAttendance: () => Promise<void>;
  userAttendance: any[];
  userEnrollments: any[];
  fetchUserEnrollments: () => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [userAttendance, setUserAttendance] = useState<any[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  // Check if the user is a teacher (simplified logic - can be enhanced based on actual app needs)
  useEffect(() => {
    if (profile) {
      // This is a simple check - you might want to implement a more robust role-based check
      setIsTeacher(profile.major === 'Faculty' || profile.batch === 'Teacher');
    }
  }, [profile]);

  const fetchClasses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase.from('classes');
      
      if (isTeacher) {
        query = query.eq('teacher_id', user.id);
      } else {
        // For students, get classes they're enrolled in
        query = query.in('id', 
          supabase.from('class_enrollments')
            .select('class_id')
            .eq('student_id', user.id)
            .eq('status', 'active')
        );
      }
      
      const { data, error } = await query.select('*');
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching classes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessions = async (classId?: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase.from('class_sessions');
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query
        .select('*, classes(name, description)')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching sessions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceRecords = async (sessionId?: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase.from('attendance_records');
      
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      
      const { data, error } = await query
        .select('*, profiles(name, student_id)')
        .order('marked_at', { ascending: false });
      
      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching attendance records",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserAttendance = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          class_sessions(
            date, 
            classes(
              name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('marked_at', { ascending: false });
      
      if (error) throw error;
      setUserAttendance(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching your attendance",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserEnrollments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          *,
          classes(
            name,
            description,
            profiles(name)
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'active');
      
      if (error) throw error;
      setUserEnrollments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching your enrollments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createClass = async (classData: any) => {
    if (!user || !isTeacher) return null;
    
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          ...classData,
          teacher_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh classes list
      await fetchClasses();
      
      toast({
        title: "Class created successfully",
        description: `${classData.name} has been created.`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating class",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const createSession = async (sessionData: any) => {
    if (!user || !isTeacher) return null;
    
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .insert(sessionData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh sessions list
      await fetchSessions(sessionData.class_id);
      
      toast({
        title: "Session created successfully",
        description: `Session for ${new Date(sessionData.date).toLocaleDateString()} has been created.`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating session",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const generateQRCode = async (sessionId: string) => {
    if (!user || !isTeacher) return null;
    
    try {
      const { data, error } = await supabase
        .rpc('generate_session_qr', { session_uuid: sessionId });
      
      if (error) throw error;
      
      toast({
        title: "QR Code generated",
        description: "The QR code is valid for 5 minutes.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error generating QR code",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const verifyAttendance = async (sessionId: string, qrCode: string, location?: { lat: number, lng: number }) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .rpc('verify_attendance_qr', { 
          session_uuid: sessionId, 
          qr_code: qrCode,
          lat: location?.lat,
          lng: location?.lng
        });
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: "Attendance marked successfully",
          description: "You have been marked as present.",
        });
      } else {
        toast({
          title: "Failed to mark attendance",
          description: "The QR code is invalid or expired.",
          variant: "destructive",
        });
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error verifying attendance",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const markAttendance = async (sessionId: string, studentId: string, status: string, notes?: string) => {
    if (!user || !isTeacher) return false;
    
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert({
          session_id: sessionId,
          student_id: studentId,
          status,
          notes,
          marked_by: user.id,
          scan_method: 'manual'
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Attendance updated",
        description: `Student attendance has been marked as ${status}.`,
      });
      
      // Refresh attendance records
      await fetchAttendanceRecords(sessionId);
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error marking attendance",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const value = {
    classes,
    sessions,
    attendanceRecords,
    isTeacher,
    isLoading,
    generateQRCode,
    verifyAttendance,
    fetchClasses,
    fetchSessions,
    fetchAttendanceRecords,
    createClass,
    createSession,
    markAttendance,
    fetchUserAttendance,
    userAttendance,
    userEnrollments,
    fetchUserEnrollments,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};
