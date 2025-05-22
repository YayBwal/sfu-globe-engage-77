
# Attendance System Server

This is a minimal Express.js server that provides APIs for a QR-based attendance system.

## APIs

1. **POST /generate-qr** (for teachers)
   - Generates a unique QR code token for a class session
   - Body: `{ classId: string }`
   - Response: `{ token: string, expiresAt: string }`

2. **POST /mark-attendance** (for students)
   - Marks a student as present using the QR code token
   - Body: `{ studentId: string, classId: string, token: string }`
   - Response: Success or error message

3. **GET /attendance?classId=xyz**
   - Retrieves attendance records for a specific class
   - Query parameter: `classId`
   - Response: Array of attendance records

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

The server will run on port 3001 by default. You can change the port by setting the PORT environment variable.
