
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data stores
const qrTokens = new Map(); // Stores active QR tokens
const attendanceRecords = []; // Stores attendance records

// POST /generate-qr (teacher use)
app.post('/generate-qr', (req, res) => {
  try {
    const { classId } = req.body;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }
    
    // Generate a unique token
    const token = uuidv4();
    
    // Set expiration time (10 minutes from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    
    // Store the token with its metadata
    qrTokens.set(token, {
      classId,
      date: now.toISOString().split('T')[0], // Store just the date part
      expiresAt,
    });
    
    // Return the token and expiration time
    return res.status(201).json({ token, expiresAt });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// POST /mark-attendance (student use)
app.post('/mark-attendance', (req, res) => {
  try {
    const { studentId, classId, token } = req.body;
    
    // Validate required fields
    if (!studentId || !classId || !token) {
      return res.status(400).json({ error: 'Student ID, Class ID, and Token are required' });
    }
    
    // Verify token exists
    if (!qrTokens.has(token)) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Get token data
    const tokenData = qrTokens.get(token);
    
    // Verify token is not expired
    if (new Date() > new Date(tokenData.expiresAt)) {
      return res.status(400).json({ error: 'Token has expired' });
    }
    
    // Verify class ID matches
    if (tokenData.classId !== classId) {
      return res.status(400).json({ error: 'Token does not match this class' });
    }
    
    // Check if student already marked attendance for this class/date
    const isDuplicate = attendanceRecords.some(record => 
      record.studentId === studentId && 
      record.classId === classId && 
      record.date === tokenData.date
    );
    
    if (isDuplicate) {
      return res.status(400).json({ error: 'Attendance already marked for this class today' });
    }
    
    // Record attendance
    const attendanceRecord = {
      id: uuidv4(),
      studentId,
      classId,
      date: tokenData.date,
      timestamp: new Date().toISOString(),
      status: 'present'
    };
    
    attendanceRecords.push(attendanceRecord);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Attendance marked successfully',
      record: attendanceRecord
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// GET /attendance?classId=xyz
app.get('/attendance', (req, res) => {
  try {
    const { classId } = req.query;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }
    
    // Filter attendance records by class ID
    const classAttendance = attendanceRecords.filter(record => record.classId === classId);
    
    return res.status(200).json(classAttendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Export for testing
