
import React, { useState, useEffect } from 'react';
import { QrCode, Clock, X, RefreshCw, MapPin, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  sessionId: string;
  onClose: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ sessionId, onClose }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [loading, setLoading] = useState(false);
  const [locationRadius, setLocationRadius] = useState(50); // Default radius: 50 meters
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [copied, setCopied] = useState(false);
  const { generateQRCode, updateSessionLocation } = useAttendance();
  const { toast } = useToast();

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
      setTimeLeft(600); // Reset timer to 10 minutes
      
      // Update location constraints if available
      if (currentLocation) {
        await updateSessionLocation(
          sessionId, 
          currentLocation.lat, 
          currentLocation.lng, 
          locationRadius
        );
      }
      
      toast({
        title: "QR code generated",
        description: "New attendance QR code valid for 10 minutes",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyQRCode = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: "Code copied",
        description: "QR code has been copied to clipboard",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
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
      <motion.div 
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`} 
          alt="QR Code"
          className="w-64 h-64 border-2 border-gray-200 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <motion.div 
          className="mt-2 text-gray-500 text-sm flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Clock className="w-4 h-4 mr-1 text-orange-500" />
          Code expires in: {formatTime(timeLeft)}
        </motion.div>
      </motion.div>
    );
  };

  // Animation variants for the modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 500
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { 
        duration: 0.2 
      }
    }
  };

  // Animation variants for content inside modal
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.1,
        duration: 0.4
      }
    }
  };

  // Show warning when time is running low
  const timeRunningLow = timeLeft < 60;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
        <motion.div 
          className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div 
            className="flex justify-between items-center mb-4"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-xl font-bold">Today's Attendance Code</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div 
            className="flex flex-col items-center justify-center"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-64 h-64 border-2 border-gray-200 rounded-lg flex items-center justify-center"
                >
                  <motion.div 
                    className="text-gray-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="h-16 w-16" />
                  </motion.div>
                </motion.div>
              ) : qrCode ? (
                <motion.div
                  key="qrcode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={timeRunningLow ? "pulse-warning" : ""}
                >
                  {renderQRCode(qrCode)}
                  {timeRunningLow && (
                    <motion.div 
                      className="mt-2 text-amber-600 text-sm text-center font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      QR code expiring soon! Consider refreshing.
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-gray-500 w-64 h-64 border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center"
                >
                  <p>Failed to generate QR code</p>
                  <Button onClick={generateNewQRCode} className="mt-2" size="sm">
                    Retry
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              className="w-full flex justify-center mt-4 mb-6 gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                variant="outline"
                onClick={copyQRCode}
                className="flex items-center gap-2 group hover:border-blue-500 transition-all"
                disabled={!qrCode || copied}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 group-hover:text-blue-500" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button 
                onClick={generateNewQRCode}
                className="flex items-center gap-2 bg-sfu-red hover:bg-sfu-red/90 transition-all"
                disabled={loading}
              >
                <motion.span
                  animate={loading ? { rotate: 360 } : {}}
                  transition={loading ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.span>
                Refresh
              </Button>
            </motion.div>

            {/* Location settings */}
            {currentLocation && (
              <motion.div 
                className="w-full mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
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
                
                <motion.p 
                  className="text-xs text-gray-500 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {locationRadius === 0 
                    ? 'Location validation is disabled. Students can scan from anywhere.' 
                    : `Students must be within ${locationRadius} meters of this location to mark attendance.`}
                </motion.p>
              </motion.div>
            )}

            <motion.p 
              className="text-sm text-gray-500 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Students must scan this code in class to mark attendance
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QRCodeDisplay;
