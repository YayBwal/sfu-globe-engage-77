
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  student_id: string;
  major: string;
  profile_pic?: string | null;
}

interface StudentSearchProps {
  onSelect: (user: UserProfile) => void;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const searchStudents = async () => {
      if (!searchTerm) {
        setSearchResults([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`)
          .limit(10);
          
        if (error) throw error;
        
        // Filter out current user
        const filteredResults = user ? data.filter(profile => profile.id !== user.id) : data;
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Error searching for students:", error);
        setSearchResults([]);
      }
    };

    searchStudents();
  }, [searchTerm, user]);

  return (
    <div>
      <Input
        type="text"
        placeholder="Search students..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ScrollArea className="h-[200px] mt-2">
        {searchResults.length > 0 ? (
          searchResults.map((result) => (
            <div
              key={result.id}
              className="flex items-center space-x-4 py-2 px-3 hover:bg-gray-100 cursor-pointer rounded"
              onClick={() => onSelect(result)}
            >
              <Avatar>
                <AvatarImage src={result.profile_pic || undefined} alt={result.name} />
                <AvatarFallback>{result.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-gray-600">
                  ID: {result.student_id}
                </div>
                <div className="text-sm text-gray-500">{result.major}</div>
              </div>
            </div>
          ))
        ) : (
          searchTerm && <div className="py-2 px-3 text-gray-500">No results found.</div>
        )}
      </ScrollArea>
    </div>
  );
};

export default StudentSearch;
