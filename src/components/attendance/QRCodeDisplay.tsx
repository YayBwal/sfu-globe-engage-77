
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateQRCode } from './ApiService';
import QRCode from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  sessionId: string;
  onClose: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ sessionId, onClose }) => {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const generateToken = async () => {
    setIsLoading(true);
    try {
      const response = await generateQRCode(sessionId);
      setQrToken(response.token);
      setExpiresAt(new Date(response.expiresAt));
      toast({
        title: "QR Code Generated",
        description: "New attendance QR code has been generated",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateToken();
    
    // Cleanup on unmount
    return () => {
      clearInterval(timerInterval);
    };
  }, [sessionId]);

  // Update timer every second
  const timerInterval = setInterval(() => {
    if (expiresAt) {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timerInterval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      }
    }
  }, 1000);

  const copyToClipboard = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      setIsCopied(true);
      toast({
        title: "Copied",
        description: "Token copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Attendance QR Code</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="dark:text-gray-300">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center">
          {qrToken ? (
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCode 
                value={qrToken} 
                size={220}
                level="H"
                renderAs="svg"
              />
            </div>
          ) : (
            <div className="w-[220px] h-[220px] bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          )}

          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Expires in:</span>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{timeLeft}</span>
            </div>
          </div>

          <div className="flex gap-3 mb-4 w-full">
            <Button 
              variant="outline" 
              className="flex-1 dark:border-gray-700 dark:text-gray-300"
              onClick={copyToClipboard}
              disabled={!qrToken}
            >
              {isCopied ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {isCopied ? 'Copied' : 'Copy Token'}
            </Button>
            <Button 
              className="flex-1 bg-sfu-red dark:bg-blue-600 hover:bg-sfu-red/90 dark:hover:bg-blue-700"
              onClick={generateToken}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Students must scan this QR code to mark their attendance for this session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
