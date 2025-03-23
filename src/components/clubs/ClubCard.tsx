
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Club } from "@/types/clubs";
import { Users, ChevronRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useClub } from "@/contexts/ClubContext";
import { useAuth } from "@/contexts/AuthContext";

interface ClubCardProps {
  club: Club;
  memberCount?: number;
  nextActivity?: {
    title: string;
    date: string;
  };
}

const ClubCard: React.FC<ClubCardProps> = ({ club, memberCount = 0, nextActivity }) => {
  const { requestToJoinClub, userClubs } = useClub();
  const { isAuthenticated } = useAuth();
  
  // Check if the user is already a member or has a pending request
  const userMembership = userClubs.find(membership => membership.club_id === club.id);
  const isMember = !!userMembership?.approved;
  const hasPendingRequest = !!userMembership && !userMembership.approved;

  const handleJoinRequest = () => {
    requestToJoinClub(club.id);
  };

  return (
    <Card className="h-full overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
      <div className="h-40 bg-gradient-to-br from-sfu-red/10 to-sfu-red/5">
        {club.logo_url ? (
          <img 
            src={club.logo_url} 
            alt={club.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users size={40} className="text-sfu-red/30" />
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{club.name}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{club.description}</p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Users size={16} />
          <span>{memberCount} members</span>
        </div>
        
        {nextActivity && (
          <div className="bg-sfu-lightgray p-2 rounded-lg text-xs">
            <div className="font-medium mb-1">Upcoming:</div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{nextActivity.title} - {nextActivity.date}</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2 border-t">
        {isAuthenticated ? (
          isMember ? (
            <Button variant="outline" size="sm" disabled>Already a Member</Button>
          ) : hasPendingRequest ? (
            <Button variant="outline" size="sm" disabled>Request Pending</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleJoinRequest}>Join Club</Button>
          )
        ) : (
          <Button variant="outline" size="sm" disabled>Login to Join</Button>
        )}
        
        <Link to={`/clubs/${club.id}`}>
          <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
            <span>View Profile</span>
            <ChevronRight size={14} />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ClubCard;
