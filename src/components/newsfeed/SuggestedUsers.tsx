
import React from 'react';
import { UserPlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UserSuggestion {
  name: string;
  username: string;
  avatar?: string;
}

interface SuggestedUsersProps {
  users: UserSuggestion[];
}

export const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ users }) => {
  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-4">Suggested to Follow</h3>
      <ul className="space-y-4">
        {users.map((suggestedUser, index) => (
          <li key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={suggestedUser.avatar} />
                <AvatarFallback>
                  {suggestedUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium line-clamp-1">{suggestedUser.name}</p>
                <p className="text-xs text-gray-500">@{suggestedUser.username}</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <UserPlus className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
