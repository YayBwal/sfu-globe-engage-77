import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react";
import MessageModal from '../modals/MessageModal';

interface UserProfile {
  id: string;
  name: string;
  student_id: string;
  major: string;
  image: string | null;
}

export const PartnerMatching = () => {
  const { user, profile } = useAuth();
  const router = useRouter();
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
        const response = await fetch(`/api/searchProfiles?query=${searchTerm}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Could not fetch profiles:", error);
        setSearchResults([]);
      }
    };

    fetchProfiles();
  }, [searchTerm]);

  // Fix the TypeScript error by changing studentId to student_id
  const handleMessage = async (recipient: UserProfile) => {
    if (profile) {
      setActiveRecipient({
        id: recipient.id,
        name: recipient.name,
        studentId: recipient.student_id, // Changed from studentId to student_id
        major: recipient.major,
        image: recipient.profile_pic
      });
      setIsMessageModalOpen(true);
    } else {
      router.push('/login?redirect=/study');
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
                    <AvatarImage src={result.image || undefined} alt={result.name} />
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

