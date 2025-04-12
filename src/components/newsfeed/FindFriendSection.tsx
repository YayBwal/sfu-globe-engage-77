
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/auth';
import { TypedSupabaseClient } from '@/types/supabaseCustom';

const typedSupabase = supabase as unknown as TypedSupabaseClient;

const FindFriendSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await typedSupabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,student_id.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .eq('approval_status', 'approved')
        .limit(5);
        
      if (error) throw error;
      
      setSearchResults(data as UserProfile[]);
    } catch (error) {
      console.error('Error searching for users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const { error } = await typedSupabase
        .from('connections')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });
        
      if (error) throw error;
      
      // Update the UI to reflect the sent request
      setSearchResults(results => 
        results.map(result => 
          result.id === friendId 
            ? { ...result, requestSent: true } 
            : result
        )
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-lg">Find Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Search by name or student ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-8"
              />
              {searchQuery && (
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={clearSearch}
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              <Search className="mr-1 h-4 w-4" />
              Search
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={result.profile_pic || undefined} />
                      <AvatarFallback>{result.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-gray-500">{result.student_id}</p>
                    </div>
                  </div>
                  <Button
                    variant={result.requestSent ? "secondary" : "default"}
                    size="sm"
                    onClick={() => sendFriendRequest(result.id)}
                    disabled={result.requestSent}
                  >
                    {result.requestSent ? 'Request Sent' : 'Connect'}
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="mt-4 text-center text-gray-500">
              Searching...
            </div>
          )}
          
          {searchQuery && !isSearching && searchResults.length === 0 && (
            <div className="mt-4 text-center text-gray-500">
              No results found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FindFriendSection;
