
import React, { useState, useEffect } from 'react';
import { QrCode, Camera, X, RefreshCcw, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Progress } from '@/components/ui/progress';
import { markAttendance } from './ApiService';
import { useAuth } from '@/contexts/AuthContext';
import QrReader from 'react-qr-reader';

interface QRScannerProps {
  sessionId: string;
  onSuccess?: () => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ sessionId, onSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processingAttendance, setProcessingAttendance] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'approved' | 'denied'>('checking');
  
  const { toast } = useToast();
  const { checkLocationValidity } = useAttendance();
  const { user } = useAuth();

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
    if (data && !scanResult && !processingAttendance) {
      setScanResult(data);
      setScanning(false);
      setProcessingAttendance(true);

      try {
        // Process the scanned QR code data
        const studentId = user?.id || 'demo-student-id';
        
        await markAttendance(studentId, sessionId, data);
        
        toast({
          title: "Success!",
          description: "Your attendance has been marked successfully",
          variant: "default",
        });
        
        // Call the success callback
        onSuccess?.();
        
        // Close the scanner after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (error: any) {
        console.error('Error marking attendance:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to mark attendance",
          variant: "destructive",
        });
        // Reset to allow trying again
        setScanResult(null);
        setProcessingAttendance(false);
      }
    }
  };

  const handleScanError = (err: any) => {
    console.error('QR scan error:', err);
    toast({
      title: "Scanner Error",
      description: "There was a problem with the QR scanner. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">Scan Attendance QR Code</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="dark:text-gray-300">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center">
          {/* Location status indicator */}
          <div className={`w-full mb-4 p-3 border rounded-lg 
            ${locationStatus === 'approved' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900' : 
              locationStatus === 'denied' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900' : 
              'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-700'}`}>
            
            <div className="flex items-center mb-1">
              <MapPin className={`h-4 w-4 mr-2 
                ${locationStatus === 'approved' ? 'text-green-600 dark:text-green-400' : 
                  locationStatus === 'denied' ? 'text-red-600 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`} />
              
              <span className={`text-sm font-medium
                ${locationStatus === 'approved' ? 'text-green-600 dark:text-green-400' : 
                  locationStatus === 'denied' ? 'text-red-600 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`}>
                {locationStatus === 'approved' ? 'Location Verified' : 
                  locationStatus === 'denied' ? 'Location Invalid' : 'Checking Location...'}
              </span>
            </div>
            
            {locationStatus === 'checking' && (
              <Progress className="h-1 mb-2" value={50} />
            )}
            
            {locationError ? (
              <div className="flex items-start mt-1 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3 mr-1 mt-0.5" />
                <p>{locationError}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {locationStatus === 'approved' 
                  ? 'You are in the correct location to mark attendance' 
                  : locationStatus === 'denied'
                  ? 'You must be physically present in the classroom'
                  : 'Verifying your location...'}
              </p>
            )}
          </div>

          {processingAttendance && (
            <div className="w-full mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Processing attendance...</span>
              </div>
            </div>
          )}

          {scanResult && !processingAttendance && (
            <div className="w-full mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">QR code scanned successfully!</span>
              </div>
            </div>
          )}

          {!scanning && !scanResult ? (
            <>
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6 flex items-center justify-center">
                <QrCode className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                Click the button below to scan the attendance QR code shown by your teacher
              </p>
              <Button 
                onClick={startScanner} 
                className="flex items-center gap-2 bg-sfu-red hover:bg-sfu-red/90 dark:bg-blue-600 dark:hover:bg-blue-700"
                disabled={locationStatus === 'denied'}
              >
                <Camera className="h-4 w-4" />
                Start Scanning
              </Button>
              
              {locationStatus === 'denied' && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center">
                  You must be within the required distance from the classroom to mark attendance
                </p>
              )}
            </>
          ) : scanning && (
            <>
              <div className="w-64 h-64 bg-black rounded-lg mb-6 relative">
                {cameraPermission === false ? (
                  <div className="text-white text-center p-4">
                    <p>Camera access denied.</p>
                    <p className="text-sm mt-2">Please allow camera access in your browser settings.</p>
                  </div>
                ) : (
                  <QrReader
                    delay={300}
                    onError={handleScanError}
                    onScan={handleScan}
                    style={{ width: '100%' }}
                    facingMode="environment"
                  />
                )}
                <div className="absolute inset-0 border-2 border-green-500 rounded-lg opacity-70 pointer-events-none"></div>
              </div>
              <Button
                onClick={() => setScanning(false)}
                variant="outline"
                className="flex items-center gap-2 dark:border-gray-700 dark:text-gray-300"
              >
                <X className="h-4 w-4" />
                Cancel Scan
              </Button>
              {cameraPermission === false && (
                <Button
                  onClick={startScanner}
                  className="mt-2 flex items-center gap-2 bg-sfu-red hover:bg-sfu-red/90 dark:bg-blue-600 dark:hover:bg-blue-700"
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
