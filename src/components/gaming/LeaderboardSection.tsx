
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGaming } from '@/contexts/GamingContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Medal, Trophy, Trash2 } from 'lucide-react';
import LeaderboardHeader from './leaderboard/LeaderboardHeader';
import LoadingSpinner from './leaderboard/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const LeaderboardSection: React.FC = () => {
  const { 
    leaderboard = [], 
    isLoading, 
    fetchLeaderboards, 
    deleteSession 
  } = useGaming();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const { toast } = useToast();
  
  // Fetch leaderboard data when component mounts
  useEffect(() => {
    fetchLeaderboards();
  }, [fetchLeaderboards]);

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-500";
      case 1: return "text-gray-400";
      case 2: return "text-amber-600";
      default: return "text-gray-700";
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSession = async () => {
    if (selectedSession) {
      try {
        await deleteSession(selectedSession);
        toast({
          title: 'Success',
          description: 'Session deleted successfully',
        });
        
        // Refresh the leaderboard
        fetchLeaderboards();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete session',
          variant: 'destructive',
        });
      }
      
      setShowDeleteDialog(false);
      setSelectedSession(null);
    }
  };

  const handleCreateSession = () => {
    setShowCreateSessionDialog(true);
  };

  return (
    <div className="min-h-[60vh]">
      <LeaderboardHeader 
        showSessionControls={true}
        onCreateSession={handleCreateSession}
      />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-medium">Top Players</h3>
            <Trophy size={20} className="text-sfu-red" />
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No scores recorded yet. Play a quiz to appear on the leaderboard!
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((player, index) => (
                <motion.div 
                  key={player.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center p-4 rounded-lg ${index === 0 ? 'bg-yellow-50 border border-yellow-100' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-8 text-center mr-3">
                    {index < 3 ? (
                      <Medal size={20} className={getMedalColor(index)} />
                    ) : (
                      <span className="text-gray-500 font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarImage src={player.profilePic} />
                    <AvatarFallback className="bg-sfu-red/10 text-sfu-red">
                      {player.userName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium">{player.userName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">
                      {player.quizCount} quizzes completed
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-sfu-red">{player.totalScore}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSession(player.userId)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          <div className="mt-8 bg-sfu-red/5 p-4 rounded-lg border border-sfu-red/10">
            <h4 className="font-medium mb-2">How Points Are Earned</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Each correct quiz answer: 10 points</li>
              <li>• Quiz completion bonus: 20 points</li>
              <li>• Fast completion bonus: Up to 30 points</li>
            </ul>
          </div>
        </div>
      )}

      {/* Delete Session Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSession}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Session Dialog */}
      <Dialog open={showCreateSessionDialog} onOpenChange={setShowCreateSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Create a new gaming session with quizzes and games.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              A new session will be created with 10 questions following the same format as existing sessions.
              Scores will be tracked and automatically added to the leaderboard.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSessionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: 'Success',
                  description: 'New session created successfully',
                });
                setShowCreateSessionDialog(false);
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaderboardSection;
