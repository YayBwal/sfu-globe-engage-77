
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface QRCodeResponse {
  token: string;
  expiresAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  timestamp: string;
  status: string;
  name?: string;
  studentIdNumber?: string;
}

export interface MarkAttendanceResponse {
  success: boolean;
  message: string;
  record: AttendanceRecord;
}

// Generate QR code token (teacher use)
export const generateQRCode = async (classId: string): Promise<QRCodeResponse> => {
  try {
    // Use the generate_session_qr function that we defined in Supabase
    const { data: token, error } = await supabase
      .rpc('generate_session_qr', { session_uuid: classId });
      
    if (error) throw error;
    
    // Get the session to determine when the QR code expires
    const { data: sessionData } = await supabase
      .from('class_sessions')
      .select('qr_generated_at, qr_expiry_time')
      .eq('id', classId)
      .single();
      
    // Calculate expiry time (default to 5 minutes from now if not found)
    const expirySeconds = sessionData?.qr_expiry_time || 300;
    const generatedAt = sessionData?.qr_generated_at ? new Date(sessionData.qr_generated_at) : new Date();
    const expiresAt = new Date(generatedAt.getTime() + expirySeconds * 1000);
    
    return {
      token,
      expiresAt: expiresAt.toISOString()
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Mark attendance using QR code token (student use)
export const markAttendance = async (
  studentId: string,
  sessionId: string,
  token: string
): Promise<MarkAttendanceResponse> => {
  try {
    // Use the verify_attendance_qr function that we defined in Supabase
    const { data: isValid, error: verifyError } = await supabase
      .rpc('verify_attendance_qr', {
        session_uuid: sessionId,
        qr_code: token
      });
    
    if (verifyError) throw verifyError;
    
    if (!isValid) {
      throw new Error('Invalid or expired token');
    }
    
    // Get the record that was just created
    const { data: record, error: recordError } = await supabase
      .from('attendance_records')
      .select(`
        id,
        student_id,
        session_id,
        marked_at,
        status,
        profiles!attendance_records_student_id_fkey(name, student_id)
      `)
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();
    
    if (recordError) throw recordError;
    
    // Format the record for the response
    const attendanceRecord: AttendanceRecord = {
      id: record.id,
      studentId: record.student_id,
      classId: record.session_id,
      date: new Date(record.marked_at).toISOString().split('T')[0],
      timestamp: record.marked_at,
      status: record.status,
      name: record.profiles?.name,
      studentIdNumber: record.profiles?.student_id
    };
    
    return {
      success: true,
      message: 'Attendance marked successfully',
      record: attendanceRecord
    };
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

// Get class attendance records
export const getClassAttendance = async (sessionId: string): Promise<AttendanceRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        student_id,
        session_id,
        marked_at,
        status,
        profiles!attendance_records_student_id_fkey(name, student_id)
      `)
      .eq('session_id', sessionId);
    
    if (error) throw error;
    
    if (!data) return [];
    
    // Format the records
    const formattedRecords: AttendanceRecord[] = data.map(record => ({
      id: record.id,
      studentId: record.student_id,
      classId: record.session_id,
      date: new Date(record.marked_at).toISOString().split('T')[0],
      timestamp: record.marked_at,
      status: record.status,
      name: record.profiles?.name,
      studentIdNumber: record.profiles?.student_id
    }));
    
    return formattedRecords;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};

// Generate example attendance data for a session
export const generateExampleAttendanceData = async (sessionId: string, teacherId: string): Promise<boolean> => {
  try {
    // First, get all students enrolled in the class
    const { data: session } = await supabase
      .from('class_sessions')
      .select('class_id')
      .eq('id', sessionId)
      .single();
    
    if (!session) throw new Error('Session not found');
    
    // Get enrolled students
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id, profiles!class_enrollments_student_id_fkey(name, student_id)')
      .eq('class_id', session.class_id)
      .eq('status', 'active');
    
    if (!enrollments || enrollments.length === 0) {
      // No enrolled students found, create some example students for demonstration
      const exampleStudents = [
        { name: 'John Smith', id: uuidv4(), studentId: 'S12345' },
        { name: 'Sarah Johnson', id: uuidv4(), studentId: 'S12346' },
        { name: 'David Lee', id: uuidv4(), studentId: 'S12347' },
        { name: 'Maria Garcia', id: uuidv4(), studentId: 'S12348' },
        { name: 'James Wilson', id: uuidv4(), studentId: 'S12349' },
        { name: 'Emma Davis', id: uuidv4(), studentId: 'S12350' },
        { name: 'Michael Brown', id: uuidv4(), studentId: 'S12351' },
        { name: 'Lisa Martinez', id: uuidv4(), studentId: 'S12352' }
      ];
      
      const statusOptions = ['present', 'late', 'absent', 'excused'];
      const now = new Date();
      
      // Create attendance records for example students
      const attendanceRecords = exampleStudents.map(student => {
        // Randomly assign a status, but make majority present
        const randomIndex = Math.floor(Math.random() * 10);
        const status = randomIndex < 6 ? 'present' : statusOptions[randomIndex % statusOptions.length];
        
        // Randomize the check-in time slightly for variety
        const minutesAgo = Math.floor(Math.random() * 30);
        const markedAt = new Date(now.getTime() - minutesAgo * 60000).toISOString();
        
        return {
          session_id: sessionId,
          student_id: student.id,
          status: status,
          marked_by: teacherId,
          scan_method: status === 'present' ? 'qr' : 'manual',
          marked_at: markedAt,
          notes: status === 'excused' ? 'Medical appointment' : null,
          // Add fake profiles data for display
          profiles: {
            name: student.name,
            student_id: student.studentId
          }
        };
      });
      
      return true;
    } else {
      // Use real enrolled students to create attendance records
      const statusOptions = ['present', 'late', 'absent', 'excused'];
      const now = new Date();
      
      // Create attendance records
      const attendanceRecords = enrollments.map(enrollment => {
        // Randomly assign a status, but make majority present
        const randomIndex = Math.floor(Math.random() * 10);
        const status = randomIndex < 6 ? 'present' : statusOptions[randomIndex % statusOptions.length];
        
        // Randomize the check-in time slightly for variety
        const minutesAgo = Math.floor(Math.random() * 30);
        const markedAt = new Date(now.getTime() - minutesAgo * 60000).toISOString();
        
        return {
          session_id: sessionId,
          student_id: enrollment.student_id,
          status: status,
          marked_by: teacherId,
          scan_method: status === 'present' ? 'qr' : 'manual',
          marked_at: markedAt,
          notes: status === 'excused' ? 'Medical appointment' : null
        };
      });
      
      // Insert attendance records
      const { error } = await supabase.from('attendance_records').insert(attendanceRecords);
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error generating example attendance data:', error);
    return false;
  }
};
