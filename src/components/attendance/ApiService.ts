
import axios from 'axios';

// API base URL - set to your Express server address
const API_BASE_URL = 'http://localhost:3001';

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
    const response = await axios.post(`${API_BASE_URL}/generate-qr`, { classId });
    return response.data;
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
    const response = await axios.post(`${API_BASE_URL}/mark-attendance`, {
      studentId,
      classId,
      token,
    });
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

// Get class attendance records
export const getClassAttendance = async (classId: string): Promise<AttendanceRecord[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/attendance`, {
      params: { classId },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};
