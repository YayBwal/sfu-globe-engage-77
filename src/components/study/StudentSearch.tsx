
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { UserSearch, MessageCircle, X, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { allStudentsData } from "@/data/StudyData";

interface StudentSearchProps {
  studentIdLookup: string;
  setStudentIdLookup: (id: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  matchedStudents: any[];
  onViewProfile: (student: any) => void;
  onSendConnectionRequest: (studentId: string) => void;
  onOpenMessaging: (student: any) => void;
  onRemoveConnection: (studentId: string) => void;
  isConnected: (studentId: string) => boolean;
  isPendingConnection: (studentId: string) => boolean;
  connections: string[];
  user: any;
}

const StudentSearch: React.FC<StudentSearchProps> = ({
  studentIdLookup,
  setStudentIdLookup,
  onSearch,
  isSearching,
  matchedStudents,
  onViewProfile,
  onSendConnectionRequest,
  onOpenMessaging,
  onRemoveConnection,
  isConnected,
  isPendingConnection,
  connections,
  user
}) => {
  const { toast } = useToast();
  
  return (
    <div className="bg-sfu-lightgray p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center">
          <UserSearch size={20} />
        </div>
        <h2 className="text-xl font-display font-semibold">Find Students by ID</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Enter a student ID to find potential study partners from your college.
      </p>
      
      <div className="flex gap-3 mb-6">
        <div className="flex-grow">
          <Input 
            type="text" 
            placeholder="Try: 2024D5963, 2024D5962, etc." 
            value={studentIdLookup}
            onChange={(e) => setStudentIdLookup(e.target.value)}
            className="bg-white"
          />
        </div>
        <Button
          onClick={onSearch}
          disabled={isSearching}
          className="bg-sfu-red hover:bg-sfu-red/90 text-white"
        >
          {isSearching ? "Searching..." : "Find Student"}
        </Button>
      </div>
      
      {user && (
        <div className="mb-4 p-3 bg-white rounded-lg text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">Your student ID:</span>
            <span className="font-mono text-xs font-semibold bg-sfu-red/10 text-sfu-red px-2 py-1 rounded">
              {user.studentId}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Other students can find you using this ID. Share it with classmates you want to study with!
          </p>
        </div>
      )}
      
      {connections.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg">
          <h3 className="font-medium text-sm mb-2">Your Connections ({connections.length})</h3>
          <div className="space-y-2">
            {connections.map(studentId => {
              const student = allStudentsData.find(s => s.studentId === studentId);
              if (!student) return null;
              
              return (
                <div key={student.id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{student.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => onOpenMessaging(student)}
                    >
                      <MessageCircle size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => onRemoveConnection(student.studentId)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="space-y-3 mt-6">
        <h3 className="font-medium text-sm uppercase text-gray-500">
          {matchedStudents.length > 0 ? "Matched Students" : "Find students to display results"}
        </h3>
        
        {isSearching ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 mx-auto border-2 border-sfu-red border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Searching for students...</p>
          </div>
        ) : matchedStudents.length > 0 ? (
          matchedStudents.map(student => (
            <div key={student.id} className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-gray-200">
                  <AvatarFallback className="bg-sfu-red/10 text-sfu-red">
                    {student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-xs text-gray-500">{student.major} - {student.batch}</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-sfu-red">{student.course}</span>
                <span className="text-xs text-gray-500">{student.studentId}</span>
                <div className="flex gap-2 mt-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs p-0 h-auto text-blue-500"
                    onClick={() => onViewProfile(student)}
                  >
                    View Profile
                  </Button>
                  
                  {isConnected(student.studentId) ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs p-0 h-auto text-green-600 flex items-center gap-1"
                      onClick={() => onOpenMessaging(student)}
                    >
                      <MessageCircle size={12} />
                      Message
                    </Button>
                  ) : isPendingConnection(student.studentId) ? (
                    <span className="text-xs text-orange-500">Request Sent</span>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs p-0 h-auto text-indigo-600 flex items-center gap-1"
                      onClick={() => onSendConnectionRequest(student.studentId)}
                    >
                      <UserPlus size={12} />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            Enter a student ID above to find potential study partners
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSearch;
