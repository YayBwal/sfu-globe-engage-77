
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Eye, EyeOff, Users, ExternalLink, MessageSquare, Check, Trash2 } from 'lucide-react';
import { StudySession } from '@/pages/Study';
import { useAuth } from '@/contexts/AuthContext';

interface SessionCardProps {
  session: StudySession;
  joined: boolean;
  isJoining: boolean;
  onJoin: (session: StudySession) => void;
  onOpenChat: (session: StudySession) => void;
  onDelete?: (session: StudySession) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  joined, 
  isJoining, 
  onJoin, 
  onOpenChat,
  onDelete
}) => {
  const { user } = useAuth();
  const isHost = user && session.host_id === user.id;
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy • h:mm a');
    } catch (error) {
      return 'Date not specified';
    }
  };

  return (
    <Card key={session.id} className="bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex justify-between">
            <h3 className="text-xl font-semibold text-gray-800">{session.subject}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              session.type === 'online' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {session.type === 'online' ? 'Online' : 'In Person'}
            </span>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>{formatDate(session.date)}</span>
            </div>
            
            {session.end_date && (
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>Ends: {formatDate(session.end_date)}</span>
              </div>
            )}
            
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span>{session.location || 'Location not specified'}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span>{session.participants || 0} participants</span>
            </div>
          </div>
          
          {joined && session.description && (
            <div className="mt-3 text-gray-600 text-sm">
              <p>{session.description}</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center">
            {session.password && (
              <div className="text-xs text-amber-600 flex items-center mr-3">
                <EyeOff className="h-3 w-3 mr-1" />
                <span>Password protected</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {joined ? (
              <>
                <Button 
                  onClick={() => onOpenChat(session)}
                  size="sm"
                  variant="outline"
                  className="text-indigo-600"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                
                {session.type === 'online' && session.meeting_link && (
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-blue-600"
                    onClick={() => window.open(session.meeting_link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Join Meeting
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="connected"
                  className="text-white"
                  disabled
                >
                  <Check className="h-4 w-4 mr-1" />
                  Joined
                </Button>
              </>
            ) : (
              <>
                {isHost && onDelete && (
                  <Button
                    onClick={() => onDelete(session)}
                    size="sm"
                    variant="destructive"
                    className="text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
                <Button
                  onClick={() => onJoin(session)}
                  size="sm"
                  variant="default"
                  className="bg-sfu-red hover:bg-sfu-red/90 text-white"
                  disabled={isJoining}
                >
                  {isJoining && session.id === session.id ? 'Joining...' : 'Join Session'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
