
import React, { useState, useEffect } from 'react';
import { QrCode, Clock, X, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Slider } from '@/components/ui/slider';

interface QRCodeDisplayProps {
  sessionId: string;
  onClose: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ sessionId, onClose }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [loading, setLoading] = useState(false);
  const [locationRadius, setLocationRadius] = useState(50); // Default radius: 50 meters
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const { generateQRCode, updateSessionLocation } = useAttendance();

  useEffect(() => {
    generateNewQRCode();

    // Get current location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!qrCode) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qrCode]);

  useEffect(() => {
    if (currentLocation) {
      updateSessionLocation(sessionId, currentLocation.lat, currentLocation.lng, locationRadius);
    }
  }, [currentLocation, locationRadius, sessionId, updateSessionLocation]);

  const generateNewQRCode = async () => {
    setLoading(true);
    try {
      const code = await generateQRCode(sessionId);
      setQrCode(code);
      setTimeLeft(300); // Reset timer to 5 minutes
      
      // Update location constraints if available
      if (currentLocation) {
        await updateSessionLocation(
          sessionId, 
          currentLocation.lat, 
          currentLocation.lng, 
          locationRadius
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to generate QR code SVG
  const generateQRCodeSVG = (data: string) => {
    // This is a simplified QR code representation
    // In a real-world scenario, you would use a library like qrcode.react
    return (
      <div className="relative">
        <QrCode className="h-40 w-40 mx-auto" />
        <div className="text-xs mt-2 text-center">Code: {data.substring(0, 8)}...</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Attendance QR Code</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-lg mb-4 flex items-center justify-center">
            {loading ? (
              <div className="animate-pulse text-gray-400">
                <RefreshCw className="h-16 w-16 animate-spin" />
              </div>
            ) : qrCode ? (
              generateQRCodeSVG(qrCode)
            ) : (
              <div className="text-center text-gray-500">
                <p>Failed to generate QR code</p>
                <Button onClick={generateNewQRCode} className="mt-2" size="sm">
                  Retry
                </Button>
              </div>
            )}
          </div>

          <div
            className={`flex items-center ${
              timeLeft <= 60 ? 'text-red-500' : 'text-gray-700'
            } mb-4`}
          >
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-mono font-medium">
              {formatTime(timeLeft)} remaining
            </span>
          </div>

          {/* Location settings */}
          {currentLocation && (
            <div className="w-full mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center mb-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-sfu-red" />
                <span>Location Validation</span>
              </div>
              
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>Distance Required: {locationRadius} meters</span>
                <span>{locationRadius === 0 ? 'Disabled' : 'Enabled'}</span>
              </div>
              
              <Slider
                value={[locationRadius]}
                min={0}
                max={200}
                step={10}
                onValueChange={(value) => setLocationRadius(value[0])}
                className="my-2"
              />
              
              <p className="text-xs text-gray-500 mt-1">
                {locationRadius === 0 
                  ? 'Location validation is disabled. Students can scan from anywhere.' 
                  : `Students must be within ${locationRadius} meters of this location to mark attendance.`}
              </p>
            </div>
          )}

          <div className="text-gray-600 text-sm text-center mb-4">
            <p>Ask students to scan this QR code to mark attendance</p>
            <p>The code will expire in 5 minutes</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
            <Button
              onClick={generateNewQRCode}
              className="flex items-center gap-2 bg-sfu-red hover:bg-sfu-red/90"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Generate New
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
