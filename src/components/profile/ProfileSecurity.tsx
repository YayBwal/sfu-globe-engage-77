
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Shield, Facebook, Mail } from "lucide-react";
import { updatePassword } from "@/services/authService";
import { PasswordInput } from "@/components/ui/password-input";

const ProfileSecurity = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "New password and confirmation password must match.",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    setLoading(true);
    try {
      await updatePassword(passwords.new);
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      // Reset form
      setPasswords({
        current: "",
        new: "",
        confirm: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Security Settings</h3>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-md font-medium mb-4 flex items-center">
              <Lock className="mr-2 h-5 w-5 text-sfu-red" /> Change Password
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="current">Current Password</Label>
                <PasswordInput
                  id="current"
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="new">New Password</Label>
                <PasswordInput
                  id="new"
                  name="new"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <PasswordInput
                  id="confirm"
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardContent className="pt-6">
          <h4 className="text-md font-medium mb-4 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-sfu-red" /> Linked Accounts
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-gray-500">Primary sign-in method</p>
                </div>
              </div>
              <Button variant="outline" disabled>Connected</Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Facebook className="h-5 w-5 mr-3 text-blue-600" />
                <div>
                  <p className="font-medium">Facebook</p>
                  <p className="text-sm text-gray-500">Link your Facebook account</p>
                </div>
              </div>
              <Button variant="outline">Connect</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSecurity;
