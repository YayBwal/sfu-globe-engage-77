
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  showHomeLink?: boolean;
}

const BackButton = ({ to, label = 'Back', showHomeLink = true }: BackButtonProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (to) {
      // Navigate to specific route if provided
      navigate(to);
    } else {
      // Go back in history if no route provided
      navigate(-1);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleClick}
        className="flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        {label}
      </Button>
      
      {showHomeLink && (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex items-center gap-1"
        >
          <Link to="/gaming">
            <Home size={16} />
            Gaming Hub
          </Link>
        </Button>
      )}
    </div>
  );
};

export default BackButton;
