
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import MessageModal from '../modals/MessageModal';
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  student_id: string;
  major: string;
  image?: string | null;
  profile_pic?: string | null;
}

export const PartnerMatching = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<UserProfile | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!searchTerm) {
        setSearchResults([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%,major.ilike.%${searchTerm}%`)
          .limit(10);
          
        if (error) throw error;
        
        // Filter out current user if they're in the results
        const filteredResults = user ? data.filter(profile => profile.id !== user.id) : data;
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Could not fetch profiles:", error);
        setSearchResults([]);
      }
    };

    fetchProfiles();
  }, [searchTerm, user]);

  const handleMessage = async (recipient: UserProfile) => {
    if (profile) {
      setActiveRecipient({
        id: recipient.id,
        name: recipient.name,
        student_id: recipient.student_id,
        major: recipient.major,
        image: recipient.profile_pic
      });
      setIsMessageModalOpen(true);
    } else {
      navigate('/login?redirect=/study');
    }
  };

  const closeMessageModal = () => {
    setIsMessageModalOpen(false);
    setActiveRecipient(null);
  };

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search for study partners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-md px-4 py-2 w-full"
        />
      </div>
      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((result) => (
            <Card key={result.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={result.profile_pic || undefined} alt={result.name} />
                    <AvatarFallback>{result.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{result.name}</h3>
                    <p className="text-sm text-gray-500">{result.major}</p>
                    <p className="text-sm text-gray-600">
                      ID: {result.student_id}
                    </p>
                  </div>
                </div>
                <Button onClick={() => handleMessage(result)}>Message</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={closeMessageModal}
        recipient={activeRecipient}
      />
    </div>
  );
};

export default PartnerMatching;
