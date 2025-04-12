import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AccountDangerZone = () => {
  const { deleteUserAccount, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeactivateAccount = async () => {
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
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "There was an error deleting your account.",
      });
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  const isConfirmValid = confirmText === "DELETE MY ACCOUNT";

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center mb-4 text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-medium">Danger Zone</h3>
          </div>
          
          <p className="text-sm text-gray-700 mb-4">
            Actions in this section are destructive and cannot be reversed. Please proceed with caution.
          </p>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" /> Deactivate Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Deactivate Account
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                    To confirm, please type "DELETE MY ACCOUNT" in the field below.
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-delete" className="text-red-600">Confirmation</Label>
                    <Input 
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="border-red-200 focus-visible:ring-red-400"
                      placeholder="Type DELETE MY ACCOUNT"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeactivateAccount} 
                  disabled={!isConfirmValid || loading}
                >
                  {loading ? "Processing..." : "Yes, Delete My Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDangerZone;
