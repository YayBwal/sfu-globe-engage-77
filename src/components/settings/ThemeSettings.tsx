
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

const ThemeSettings = () => {
  const { toast } = useToast();
  const { theme, updateTheme } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(theme || "light");

  useEffect(() => {
    setSelectedTheme(theme || "light");
  }, [theme]);

  const handleThemeChange = async () => {
    setLoading(true);
    
    try {
      if (updateTheme) {
        await updateTheme(selectedTheme);
        
        toast({
          title: "Theme updated",
          description: `Theme has been changed to ${selectedTheme} mode.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your theme.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRadioChange = (value: string) => {
    // Use a safer approach for event handling that doesn't get confused by event pooling
    const newValue = value; // Create a local copy of the value
    
    // Use setTimeout to handle the state change outside of the current event flow
    setTimeout(() => {
      setSelectedTheme(newValue);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Appearance Settings</h3>
          
          <RadioGroup 
            value={selectedTheme} 
            onValueChange={handleRadioChange}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center cursor-pointer">
                <Sun className="h-5 w-5 mr-3 text-amber-500" />
                <div>
                  <p className="font-medium">Light Mode</p>
                  <p className="text-sm text-gray-500">Use light theme</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center cursor-pointer">
                <Moon className="h-5 w-5 mr-3 text-indigo-600" />
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-500">Use dark theme</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center cursor-pointer">
                <Monitor className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">System Default</p>
                  <p className="text-sm text-gray-500">Follow system theme settings</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <Button 
            className="w-full mt-6" 
            onClick={handleThemeChange}
            disabled={loading || selectedTheme === theme}
          >
            {loading ? "Saving..." : "Apply Theme"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeSettings;
