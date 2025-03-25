
import React, { useState, useEffect } from 'react';
import { QrCode, Camera, X, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAttendance } from '@/contexts/AttendanceContext';

interface QRScannerProps {
  sessionId: string;
  onSuccess?: () => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ sessionId, onSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const { verifyAttendance } = useAttendance();

  useEffect(() => {
    // Request location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          toast({
            title: 'Location not available',
            description: 'We cannot verify your location. This might affect attendance validation.',
            variant: 'destructive',
          });
        }
      );
    }
  }, [toast]);

  const startScanner = async () => {
    try {
      // Check if browser supports the Web API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }

      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      setScanning(true);

      // Simulating QR code scanning since we would need a QR library in a real app
      // In a real app, you would use a library like react-qr-reader
      setTimeout(() => {
        // Simulate a successful scan
        handleScan('sample-qr-code-data');
      }, 3000);
    } catch (error) {
      setCameraPermission(false);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to scan the QR code',
        variant: 'destructive',
      });
    }
  };

  const handleScan = async (data: string | null) => {
    if (data) {
      setScanning(false);
      
      // In a real implementation, this would be the actual QR code data
      const success = await verifyAttendance(sessionId, data, location || undefined);
      
      if (success) {
        onSuccess?.();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scan Attendance QR Code</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center">
          {!scanning ? (
            <>
              <div className="w-32 h-32 bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4 text-center">
                Click the button below to scan the attendance QR code shown by your teacher
              </p>
              <Button onClick={startScanner} className="flex items-center gap-2 bg-sfu-red hover:bg-sfu-red/90">
                <Camera className="h-4 w-4" />
                Start Scanning
              </Button>
            </>
          ) : (
            <>
              <div className="w-64 h-64 bg-black rounded-lg mb-6 relative flex items-center justify-center">
                {cameraPermission === false ? (
                  <div className="text-white text-center p-4">
                    <p>Camera access denied.</p>
                    <p className="text-sm mt-2">Please allow camera access in your browser settings.</p>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 border-2 border-green-500 rounded-lg opacity-70"></div>
                    <p className="text-white text-center absolute bottom-2 left-0 right-0">
                      Position the QR code in the frame
                    </p>
                  </>
                )}
              </div>
              <Button
                onClick={() => setScanning(false)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel Scan
              </Button>
              {cameraPermission === false && (
                <Button
                  onClick={startScanner}
                  className="mt-2 flex items-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Retry
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
