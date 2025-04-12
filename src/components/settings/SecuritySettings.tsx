
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Facebook, Mail, Shield } from "lucide-react";
import { updatePassword } from "@/services/authService";

const SecuritySettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

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
      <form onSubmit={handleResetPassword} className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Lock className="mr-2 h-5 w-5 text-sfu-red" /> Change Password
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="current">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current"
                    name="current"
                    type={showPassword.current ? "text" : "password"}
                    value={passwords.current}
                    onChange={handlePasswordChange}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword.current ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="new">New Password</Label>
                <div className="relative">
                  <Input
                    id="new"
                    name="new"
                    type={showPassword.new ? "text" : "password"}
                    value={passwords.new}
                    onChange={handlePasswordChange}
                    className="pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword.new ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    name="confirm"
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={handlePasswordChange}
                    className="pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
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
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-sfu-red" /> Linked Accounts
          </h3>
          
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

export default SecuritySettings;
