
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Search, RefreshCw } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  student_id: string;
  role: string;
};

const UserRoleManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, student_id, role')
        .order('name');

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Selection required",
        description: "Please select both a user and a role",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', selectedUser.id);

      if (error) {
        throw error;
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, role: selectedRole } : user
      ));

      toast({
        title: "Role updated",
        description: `${selectedUser.name}'s role has been updated to ${selectedRole}`,
      });

      // Reset selection
      setSelectedUser(null);
      setSelectedRole('');
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          User Role Management
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2" 
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Change user roles between student and teacher
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email or student ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Student ID</th>
                  <th className="px-4 py-2 text-left font-medium">Current Role</th>
                  <th className="px-4 py-2 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      {loading ? 'Loading users...' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user.id}
                      className={`border-t hover:bg-muted/50 ${selectedUser?.id === user.id ? 'bg-muted/80' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.student_id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role || 'student'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                        >
                          {selectedUser?.id === user.id ? 'Deselect' : 'Select'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
      {selectedUser && (
        <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-2 border-t px-6 py-4">
          <div className="flex-1">
            <p className="font-medium">Selected: {selectedUser.name}</p>
            <p className="text-sm text-muted-foreground">Current role: {selectedUser.role || 'student'}</p>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleRoleChange} 
              disabled={!selectedRole || loading}
            >
              Update Role
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default UserRoleManager;
