
import React, { useState, useEffect } from "react";
import { Search, Plus, Users, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClub } from "@/contexts/ClubContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Club } from "@/types/clubs";

interface ClubFormData {
  name: string;
  description: string;
  logo: FileList;
}

const ClubsList = () => {
  const { clubs, userClubs, loading, createClub, isClubManager, requestToJoinClub } = useClub();
  const { isAuthenticated } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [membersCount, setMembersCount] = useState<Record<string, number>>({});
  
  const form = useForm<ClubFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchMembersCount();
  }, [clubs]);

  const fetchMembersCount = async () => {
    if (!clubs.length) return;

    try {
      // Use a more compatible approach for counting
      const counts: Record<string, number> = {};
      
      for (const club of clubs) {
        const { count, error } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('approved', true)
          .eq('club_id', club.id);
          
        if (!error) {
          counts[club.id] = count || 0;
        }
      }
      
      setMembersCount(counts);
    } catch (error) {
      console.error('Error fetching members count:', error);
    }
  };

  const handleCreateClub = async (data: ClubFormData) => {
    let logoUrl = undefined;
    
    // Upload logo if provided
    if (data.logo && data.logo.length > 0) {
      const file = data.logo[0];
      const fileName = `${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('club-logos')
        .upload(fileName, file);
        
      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
      } else if (uploadData) {
        const { data } = supabase.storage.from('club-logos').getPublicUrl(uploadData.path);
        logoUrl = data.publicUrl;
      }
    }
    
    const newClub = await createClub({
      name: data.name,
      description: data.description,
      logo_url: logoUrl
    });
    
    if (newClub) {
      form.reset();
      setDialogOpen(false);
    }
  };

  // Filter clubs based on search term
  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Define the five specific clubs we want to display
  const specificClubTypes = ["English Club", "Basketball Club", "IT Club", "Buddhist Club", "Music Club"];
  
  // Filter for only the specific clubs
  const specificClubs = filteredClubs.filter(club => 
    specificClubTypes.includes(club.name)
  );
  
  // Check if we need to create any of the default clubs
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const missingClubs = specificClubTypes.filter(
        clubName => !clubs.some(club => club.name === clubName)
      );
      
      if (missingClubs.length > 0) {
        createDefaultClubs(missingClubs);
      }
    }
  }, [loading, clubs, isAuthenticated]);
  
  // Create the specified default clubs if they don't exist
  const createDefaultClubs = async (clubNames: string[]) => {
    const descriptions = {
      "English Club": "Improve your English language skills through fun activities and conversations.",
      "Basketball Club": "Join us for regular basketball practice, games, and tournaments.",
      "IT Club": "Connect with fellow tech enthusiasts to learn coding, cybersecurity, and emerging technologies.",
      "Buddhist Club": "A peaceful community for meditation, Buddhist teachings, and mindfulness practices.",
      "Music Club": "For lovers of all music genres. Join us for performances, practices, and music sharing."
    };
    
    for (const clubName of clubNames) {
      await createClub({
        name: clubName,
        description: descriptions[clubName as keyof typeof descriptions],
        logo_url: undefined
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
        <div className="relative flex-grow w-full md:w-auto">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search clubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {isAuthenticated && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus size={16} className="mr-2" />
                Create New Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Club</DialogTitle>
                <DialogDescription>
                  Fill out the details to create a new club. You'll be the coordinator.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateClub)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Club Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter club name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the club's purpose and activities" 
                            {...field} 
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Club Logo (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*"
                            {...field}
                            onChange={(e) => {
                              onChange(e.target.files);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload a logo for your club (recommended size: 300x300px)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Club</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Campus Clubs</h2>
        <p className="text-gray-600 mt-2">Join any of our official campus clubs to connect with like-minded peers</p>
      </div>
      
      {loading ? (
        <div className="text-center py-20">Loading clubs...</div>
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-20 bg-sfu-lightgray rounded-xl">
          <p className="text-gray-500">No clubs found matching your search criteria.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(specificClubs.length > 0 ? specificClubs : filteredClubs).map(club => (
            <ClubItem 
              key={club.id} 
              club={club} 
              memberCount={membersCount[club.id] || 0}
              isManager={isClubManager(club.id)}
              onJoinRequest={() => requestToJoinClub(club.id)}
              userClubs={userClubs}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ClubItemProps {
  club: Club;
  memberCount: number;
  isManager: boolean;
  onJoinRequest: () => void;
  userClubs: any[];
  isAuthenticated: boolean;
}

const ClubItem: React.FC<ClubItemProps> = ({ 
  club, memberCount, isManager, onJoinRequest, userClubs, isAuthenticated
}) => {
  // Check if the user is already a member or has a pending request
  const userMembership = userClubs.find(membership => membership.club_id === club.id);
  const isMember = !!userMembership?.approved;
  const hasPendingRequest = !!userMembership && !userMembership.approved;
  
  // Club icons based on name
  const getClubIcon = (clubName: string) => {
    const colorClass = "text-sfu-red/30";
    switch(clubName) {
      case "English Club": return <span className={`text-2xl ${colorClass}`}>🔤</span>;
      case "Basketball Club": return <span className={`text-2xl ${colorClass}`}>🏀</span>;
      case "IT Club": return <span className={`text-2xl ${colorClass}`}>💻</span>;
      case "Buddhist Club": return <span className={`text-2xl ${colorClass}`}>☯️</span>;
      case "Music Club": return <span className={`text-2xl ${colorClass}`}>🎵</span>;
      default: return <Users size={40} className={colorClass} />;
    }
  };

  return (
    <Card className="h-full overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
      <div className="h-40 bg-gradient-to-br from-sfu-red/10 to-sfu-red/5 flex items-center justify-center">
        {club.logo_url ? (
          <img 
            src={club.logo_url} 
            alt={club.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getClubIcon(club.name)}
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
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2 border-t">
        {isAuthenticated ? (
          isManager ? (
            <Button variant="outline" size="sm" className="text-sfu-red">
              <Users size={14} className="mr-1" />
              Manager
            </Button>
          ) : isMember ? (
            <Button variant="outline" size="sm" disabled>Already a Member</Button>
          ) : hasPendingRequest ? (
            <Button variant="outline" size="sm" disabled>Request Pending</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onJoinRequest}>Join Club</Button>
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

export default ClubsList;
