
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// API base URL - not needed anymore as we're using Supabase
// const API_BASE_URL = 'http://localhost:3001';

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
}

export interface MarkAttendanceResponse {
  success: boolean;
  message: string;
  record: AttendanceRecord;
}

// Generate QR code token (teacher use)
export const generateQRCode = async (classId: string): Promise<QRCodeResponse> => {
  try {
    const token = uuidv4();
    const expiryMinutes = 10;
    const expiresAt = new Date(new Date().getTime() + expiryMinutes * 60000);
    
    // Insert token into Supabase
    const { error } = await supabase
      .from('attendance_tokens')
      .insert({
        class_id: classId,
        token: token,
        expires_at: expiresAt.toISOString(),
      });
      
    if (error) throw error;
    
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
  classId: string,
  token: string
): Promise<MarkAttendanceResponse> => {
  try {
    // First verify the token is valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('attendance_tokens')
      .select('*')
      .eq('token', token)
      .eq('class_id', classId)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (tokenError || !tokenData) {
      throw new Error('Invalid or expired token');
    }
    
    // Check for existing attendance record for this student/class on the same day
    const today = new Date().toISOString().split('T')[0]; // Just the date part
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .gte('marked_at', today + 'T00:00:00')
      .lte('marked_at', today + 'T23:59:59');
    
    if (checkError) throw checkError;
    
    if (existingRecord && existingRecord.length > 0) {
      throw new Error('Attendance already marked for this class today');
    }
    
    // Mark attendance
    const { data: record, error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        student_id: studentId,
        class_id: classId,
        token_id: tokenData.id,
        status: 'present'
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // Update token as used
    await supabase
      .from('attendance_tokens')
      .update({ is_used: true })
      .eq('id', tokenData.id);
    
    // Format the record for the response
    const attendanceRecord: AttendanceRecord = {
      id: record.id,
      studentId: record.student_id,
      classId: record.class_id,
      date: new Date(record.marked_at).toISOString().split('T')[0],
      timestamp: record.marked_at,
      status: record.status
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
export const getClassAttendance = async (classId: string): Promise<AttendanceRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        student_id,
        class_id,
        marked_at,
        status,
        profiles(name, student_id)
      `)
      .eq('class_id', classId);
    
    if (error) throw error;
    
    // Format the records
    const formattedRecords: AttendanceRecord[] = data.map(record => ({
      id: record.id,
      studentId: record.student_id,
      classId: record.class_id,
      date: new Date(record.marked_at).toISOString().split('T')[0],
      timestamp: record.marked_at,
      status: record.status,
      // Include profile data if available
      ...(record.profiles && { name: record.profiles.name, studentIdNumber: record.profiles.student_id })
    }));
    
    return formattedRecords;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};
