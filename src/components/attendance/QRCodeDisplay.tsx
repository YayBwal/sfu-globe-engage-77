
import React, { useState, useEffect } from 'react';
import { QrCode, Clock, X, RefreshCw, MapPin, Copy } from 'lucide-react';
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

  const copyQRCode = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to generate QR code SVG (this is just a placeholder)
  const renderQRCode = (data: string) => {
    return (
      <div className="flex flex-col items-center">
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`} 
          alt="QR Code"
          className="w-64 h-64 border-2 border-gray-200 rounded-lg"
        />
        <div className="mt-2 text-gray-500 text-sm">Code expires in: {formatTime(timeLeft)}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Today's Attendance Code</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center">
          {loading ? (
            <div className="w-64 h-64 border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <div className="animate-pulse text-gray-400">
                <RefreshCw className="h-16 w-16 animate-spin" />
              </div>
            </div>
          ) : qrCode ? (
            renderQRCode(qrCode)
          ) : (
            <div className="text-center text-gray-500 w-64 h-64 border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center">
              <p>Failed to generate QR code</p>
              <Button onClick={generateNewQRCode} className="mt-2" size="sm">
                Retry
              </Button>
            </div>
          )}

          <div className="w-full flex justify-center mt-4 mb-6 gap-2">
            <Button 
              variant="outline"
              onClick={copyQRCode}
              className="flex items-center gap-2"
              disabled={!qrCode}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button 
              onClick={generateNewQRCode}
              className="flex items-center gap-2 bg-sfu-red hover:bg-sfu-red/90"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
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

          <p className="text-sm text-gray-500 text-center">
            Students must scan this code in class to mark attendance
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
