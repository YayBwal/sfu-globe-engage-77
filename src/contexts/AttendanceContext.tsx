import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

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
  updateSessionLocation: (sessionId: string, lat: number, lng: number, radius: number) => Promise<boolean>;
  checkLocationValidity: (sessionId: string, userLocation: { lat: number, lng: number }) => Promise<boolean | null>;
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
  const [enrollments, setEnrollments] = useState<any[]>([]);
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
      let query;
      
      if (isTeacher) {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id);
        
        if (error) throw error;
        setClasses(data || []);
      } else {
        // For students, get classes they're enrolled in
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', user.id)
          .eq('status', 'active');
        
        if (enrollmentsError) throw enrollmentsError;
        
        if (enrollmentsData && enrollmentsData.length > 0) {
          const classIds = enrollmentsData.map(e => e.class_id);
          
          const { data, error } = await supabase
            .from('classes')
            .select('*')
            .in('id', classIds);
          
          if (error) throw error;
          setClasses(data || []);
        } else {
          setClasses([]);
        }
      }
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
      let query;
      
      if (classId) {
        const { data, error } = await supabase
          .from('class_sessions')
          .select('*, classes(name, description)')
          .eq('class_id', classId)
          .order('date', { ascending: false });
        
        if (error) throw error;
        setSessions(data || []);
      } else {
        const { data, error } = await supabase
          .from('class_sessions')
          .select('*, classes(name, description)')
          .order('date', { ascending: false });
        
        if (error) throw error;
        setSessions(data || []);
      }
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
      let query;
      
      if (sessionId) {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*, profiles(name, student_id)')
          .eq('session_id', sessionId)
          .order('marked_at', { ascending: false });
        
        if (error) throw error;
        setAttendanceRecords(data || []);
      } else {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*, profiles(name, student_id)')
          .order('marked_at', { ascending: false });
        
        if (error) throw error;
        setAttendanceRecords(data || []);
      }
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
      setEnrollments(data || []);
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

  const updateSessionLocation = async (
    sessionId: string, 
    lat: number, 
    lng: number, 
    radius: number
  ) => {
    if (!user || !isTeacher) return false;
    
    try {
      const { error } = await supabase
        .from('class_sessions')
        .update({
          location: `${lat},${lng}`,
          location_radius: radius
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error updating location",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const checkLocationValidity = async (
    sessionId: string,
    userLocation: { lat: number, lng: number }
  ) => {
    try {
      // Get the session details
      const { data: sessionData, error } = await supabase
        .from('class_sessions')
        .select('location, location_radius')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      
      // If no location constraints set, return true
      if (!sessionData.location || !sessionData.location_radius) {
        return true;
      }
      
      // If location radius is 0, it means location validation is disabled
      if (sessionData.location_radius === 0) {
        return true;
      }
      
      // Parse the stored location
      const [sessionLat, sessionLng] = sessionData.location.split(',').map(Number);
      
      // Calculate distance between user and session location
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        sessionLat, 
        sessionLng
      );
      
      // Check if user is within the allowed radius
      return distance <= sessionData.location_radius;
      
    } catch (error: any) {
      console.error("Error checking location validity:", error);
      // If there's an error, we'll return null to indicate we couldn't validate
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
      // If we have location, check validity first
      if (location) {
        const isLocationValid = await checkLocationValidity(sessionId, location);
        
        // If location is invalid, show a message and prevent attendance marking
        if (isLocationValid === false) {
          toast({
            title: "Location validation failed",
            description: "You are not within the required distance from the classroom.",
            variant: "destructive",
          });
          return false;
        }
      }
      
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
    enrollments,
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
    updateSessionLocation,
    checkLocationValidity,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};
