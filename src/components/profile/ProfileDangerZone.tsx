
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Download, 
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

const ProfileDangerZone = () => {
  const { profile, deleteUserAccount } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast({
        variant: "destructive",
        title: "Confirmation failed",
        description: "Please type DELETE to confirm account deletion.",
      });
      return;
    }
    
    if (!confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password required",
        description: "Please enter your password to confirm account deletion.",
      });
      return;
    }
    
    setLoading(true);
    try {
      if (deleteUserAccount) {
        await deleteUserAccount();
        toast({
          title: "Account deleted",
          description: "Your account has been permanently deleted.",
        });
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "There was an error deleting your account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportData = async () => {
    try {
      // For simplicity, this just creates a JSON representation of the profile
      // In a real app, you would fetch all user data from the backend
      const userData = {
        profile: profile,
        // Add other user data here
      };
      
      const dataStr = JSON.stringify(userData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `user-data-${new Date().toISOString()}.json`;
      
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Data exported",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      console.error("Failed to export user data:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-red-600 flex items-center">
        <AlertTriangle className="mr-2 h-5 w-5" /> Danger Zone
      </h3>
      
      <p className="text-gray-500">
        Actions in this section have serious consequences. Please proceed with caution.
      </p>
      
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Export Your Data</h4>
                <p className="text-sm text-gray-500">
                  Download a copy of all your personal data
                </p>
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
            
            <hr className="border-t border-gray-200" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-600">Delete Account</h4>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all your data
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <p>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers.
                        </p>
                        <div className="mt-4 space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-md">
                              Confirm your password:
                            </Label>
                            <PasswordInput
                              id="confirm-password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Enter your password"
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-text" className="text-md">
                              Type <span className="font-bold">DELETE</span> to confirm:
                            </Label>
                            <Input
                              id="confirm-text"
                              value={confirmText}
                              onChange={(e) => setConfirmText(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        disabled={loading || confirmText !== "DELETE" || !confirmPassword}
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {loading ? "Deleting..." : "Delete Account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileDangerZone;
