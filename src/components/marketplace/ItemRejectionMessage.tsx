
import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ItemRejectionMessageProps {
  itemId?: string;
}

const ItemRejectionMessage: React.FC<ItemRejectionMessageProps> = ({ itemId }) => {
  const { user } = useAuth();
  const [adminMessages, setAdminMessages] = useState<Array<{ id: string, message: string, created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAdminMessages = async () => {
      if (!user || !itemId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('admin_messages')
          .select('*')
          .eq('marketplace_item_id', itemId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setAdminMessages(data || []);
      } catch (err: any) {
        console.error("Error fetching admin messages:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminMessages();
  }, [user, itemId]);
  
  if (loading) return <div className="p-4 text-center">Loading feedback...</div>;
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load admin feedback: {error}</AlertDescription>
      </Alert>
    );
  }
  
  if (adminMessages.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Item Rejected</AlertTitle>
        <AlertDescription>
          Your item was rejected, but no specific feedback was provided.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Item Rejected</AlertTitle>
        <AlertDescription>
          Your item listing was rejected by an administrator with the following feedback:
        </AlertDescription>
      </Alert>
      
      {adminMessages.map((message) => (
        <div 
          key={message.id} 
          className="border p-4 rounded-md bg-gray-50"
        >
          <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(message.created_at).toLocaleString()}
          </p>
        </div>
      ))}
      
      <div className="pt-2">
        <Button variant="outline" onClick={() => window.location.href = "/marketplace"}>
          Back to Marketplace
        </Button>
      </div>
    </div>
  );
};

export default ItemRejectionMessage;
