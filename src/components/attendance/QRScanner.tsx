
import React, { useState, useEffect } from 'react';
import { QrCode, Camera, X, RefreshCcw, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Progress } from '@/components/ui/progress';

interface QRScannerProps {
  sessionId: string;
  onSuccess?: () => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ sessionId, onSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'approved' | 'denied'>('checking');
  const { toast } = useToast();
  const { verifyAttendance, checkLocationValidity } = useAttendance();

  useEffect(() => {
    // Request location if available
    if (navigator.geolocation) {
      setLocationStatus('checking');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          setLocation(currentLocation);
          
          // Check if location is valid for this session
          const isValidLocation = await checkLocationValidity(sessionId, currentLocation);
          
          if (isValidLocation === false) {
            setLocationStatus('denied');
            setLocationError('You are not within the required distance from the classroom');
          } else {
            setLocationStatus('approved');
            setLocationError(null);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
          setLocationError('We cannot verify your location. This might affect attendance validation.');
          toast({
            title: 'Location not available',
            description: 'We cannot verify your location. This might affect attendance validation.',
            variant: 'destructive',
          });
        }
      );
    }
  }, [sessionId, toast, checkLocationValidity]);

  const startScanner = async () => {
    try {
      // Check if browser supports the Web API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }

      // Check if location is valid before starting scanner
      if (locationStatus === 'denied') {
        toast({
          title: 'Location validation failed',
          description: locationError || 'You are not in the approved location for this class',
          variant: 'destructive',
        });
        return;
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
          {/* Location status indicator */}
          <div className={`w-full mb-4 p-3 border rounded-lg 
            ${locationStatus === 'approved' ? 'bg-green-50 border-green-200' : 
              locationStatus === 'denied' ? 'bg-red-50 border-red-200' : 
              'bg-gray-50 border-gray-200'}`}>
            
            <div className="flex items-center mb-1">
              <MapPin className={`h-4 w-4 mr-2 
                ${locationStatus === 'approved' ? 'text-green-600' : 
                  locationStatus === 'denied' ? 'text-red-600' : 'text-amber-500'}`} />
              
              <span className={`text-sm font-medium
                ${locationStatus === 'approved' ? 'text-green-600' : 
                  locationStatus === 'denied' ? 'text-red-600' : 'text-amber-500'}`}>
                {locationStatus === 'approved' ? 'Location Verified' : 
                  locationStatus === 'denied' ? 'Location Invalid' : 'Checking Location...'}
              </span>
            </div>
            
            {locationStatus === 'checking' && (
              <Progress className="h-1 mb-2" value={50} />
            )}
            
            {locationError ? (
              <div className="flex items-start mt-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3 mr-1 mt-0.5" />
                <p>{locationError}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                {locationStatus === 'approved' 
                  ? 'You are in the correct location to mark attendance' 
                  : locationStatus === 'denied'
                  ? 'You must be physically present in the classroom'
                  : 'Verifying your location...'}
              </p>
            )}
          </div>

          {!scanning ? (
            <>
              <div className="w-32 h-32 bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4 text-center">
                Click the button below to scan the attendance QR code shown by your teacher
              </p>
              <Button 
                onClick={startScanner} 
                className="flex items-center gap-2 bg-sfu-red hover:bg-sfu-red/90"
                disabled={locationStatus === 'denied'}
              >
                <Camera className="h-4 w-4" />
                Start Scanning
              </Button>
              
              {locationStatus === 'denied' && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  You must be within the required distance from the classroom to mark attendance
                </p>
              )}
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
