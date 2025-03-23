
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users, Search } from "lucide-react";
import { findMatchingPartners } from "@/data/StudyData";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface PartnerMatchingProps {
  onViewProfile: (student: any) => void;
}

const PartnerMatching: React.FC<PartnerMatchingProps> = ({ onViewProfile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [preferences, setPreferences] = useState({
    sameMajor: true,
    sameCourse: true,
    compatibility: 50,
  });

  const handleSliderChange = (value: number[]) => {
    setPreferences({ ...preferences, compatibility: value[0] });
  };

  const findMatches = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to use the matching feature",
        variant: "destructive"
      });
      return;
    }

    setIsMatching(true);
    setMatchResults([]);

    // Simulate API call
    setTimeout(() => {
      // Get matches from our mock function
      const matches = findMatchingPartners(user.studentId, preferences);
      
      // Filter by preferences if needed
      const filteredMatches = matches.filter(match => {
        // If we require same major and they don't match, filter out
        if (preferences.sameMajor && match.major !== user.major) return false;
        
        // If we require same course and they don't match, filter out
        if (preferences.sameCourse && match.course !== user.course) return false;
        
        // Check if match score is high enough
        return match.matchScore >= preferences.compatibility;
      });

      setMatchResults(filteredMatches);
      setIsMatching(false);

      if (filteredMatches.length === 0) {
        toast({
          title: "No matches found",
          description: "Try adjusting your preferences to find more matches",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Matches found",
          description: `Found ${filteredMatches.length} compatible study partners`,
        });
      }
    }, 2000);
  };

  return (
    <div className="p-5 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center">
          <BookOpen size={20} />
        </div>
        <h2 className="text-xl font-display font-semibold">Study Partner Matching</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Our AI-powered system will find you compatible study partners based on your preferences.
      </p>
      
      <div className="space-y-6 mb-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Match Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Same Major</label>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                <input 
                  type="checkbox"
                  className="absolute w-0 h-0 opacity-0"
                  checked={preferences.sameMajor}
                  onChange={() => setPreferences({
                    ...preferences,
                    sameMajor: !preferences.sameMajor
                  })}
                />
                <span 
                  className={`absolute left-1 top-1 bottom-1 w-4 h-4 rounded-full transition-all ${
                    preferences.sameMajor ? 'bg-sfu-red transform translate-x-6' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Same Course</label>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                <input 
                  type="checkbox"
                  className="absolute w-0 h-0 opacity-0"
                  checked={preferences.sameCourse}
                  onChange={() => setPreferences({
                    ...preferences,
                    sameCourse: !preferences.sameCourse
                  })}
                />
                <span 
                  className={`absolute left-1 top-1 bottom-1 w-4 h-4 rounded-full transition-all ${
                    preferences.sameCourse ? 'bg-sfu-red transform translate-x-6' : 'bg-gray-400'
                  }`}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Compatibility Level</label>
                <span className="text-xs bg-sfu-red/10 text-sfu-red px-2 py-1 rounded">
                  {preferences.compatibility}%
                </span>
              </div>
              <Slider 
                defaultValue={[preferences.compatibility]} 
                max={100} 
                step={5} 
                onValueChange={handleSliderChange}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full bg-sfu-red hover:bg-sfu-red/90 text-white"
          onClick={findMatches}
          disabled={isMatching}
        >
          {isMatching ? (
            <>
              <span className="mr-2">Finding matches</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Find My Study Partners
            </>
          )}
        </Button>
      </div>
      
      {matchResults.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users size={16} />
            Compatible Partners ({matchResults.length})
          </h3>
          <div className="space-y-3 mt-4">
            {matchResults.map(match => (
              <div key={match.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-sfu-red/10 text-sfu-red">
                        {match.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{match.name}</div>
                      <div className="text-xs text-gray-500">{match.major} • {match.course}</div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-sfu-red">{match.matchScore}% match</div>
                </div>
                
                <div className="mb-2">
                  <Progress value={match.matchScore} className="h-1.5" />
                </div>
                
                {match.sharedInterests.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Shared interests:</div>
                    <div className="flex flex-wrap gap-1">
                      {match.sharedInterests.map((interest: string, i: number) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs mt-1"
                  onClick={() => onViewProfile(match)}
                >
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerMatching;
