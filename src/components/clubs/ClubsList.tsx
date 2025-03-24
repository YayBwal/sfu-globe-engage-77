import React, { useState, useEffect } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClub } from "@/contexts/ClubContext";
import { useAuth } from "@/contexts/AuthContext";
import ClubCard from "./ClubCard";
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

interface ClubFormData {
  name: string;
  description: string;
  logo: FileList;
}

const ClubsList = () => {
  const { clubs, userClubs, loading, createClub } = useClub();
  const { isAuthenticated } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [membersCount, setMembersCount] = useState<Record<string, number>>({});
  const [nextActivities, setNextActivities] = useState<Record<string, { title: string; date: string }>>({});

  const form = useForm<ClubFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchMembersCount();
    fetchNextActivities();
  }, [clubs]);

  const fetchMembersCount = async () => {
    if (!clubs.length) return;

    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id, count(*)')
        .eq('approved', true)
        .in('club_id', clubs.map(club => club.id))
        .group('club_id');

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.club_id] = parseInt(item.count);
      });
      
      setMembersCount(counts);
    } catch (error) {
      console.error('Error fetching members count:', error);
    }
  };

  const fetchNextActivities = async () => {
    if (!clubs.length) return;

    try {
      // For each club, get the next upcoming activity
      const activities: Record<string, { title: string; date: string }> = {};
      
      for (const club of clubs) {
        const { data, error } = await supabase
          .from('club_activities')
          .select('title, event_date')
          .eq('club_id', club.id)
          .gt('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();
          
        if (!error && data) {
          activities[club.id] = {
            title: data.title,
            date: new Date(data.event_date).toLocaleDateString()
          };
        }
      }
      
      setNextActivities(activities);
    } catch (error) {
      console.error('Error fetching next activities:', error);
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
          {filteredClubs.map(club => (
            <ClubCard 
              key={club.id} 
              club={club} 
              memberCount={membersCount[club.id] || 0}
              nextActivity={nextActivities[club.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubsList;
