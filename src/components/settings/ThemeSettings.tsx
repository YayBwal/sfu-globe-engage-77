
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";

const ThemeSettings = () => {
  const { theme, updateTheme } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleThemeChange = async (newTheme: string) => {
    if (!updateTheme) return;
    
    setLoading(newTheme);
    try {
      await updateTheme(newTheme);
      
      // Apply theme immediately for better user experience
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      if (newTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
      
      toast({
        title: "Theme updated",
        description: `Theme changed to ${newTheme} mode.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Theme update failed",
        description: "There was a problem updating your theme preference.",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Sun className="mr-2 h-5 w-5 text-sfu-red" /> Appearance
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            Choose how SFU Connect looks for you. Select a theme preference.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-24 ${
                theme === "light" ? "border-2 border-primary" : ""
              }`}
              onClick={() => handleThemeChange("light")}
              disabled={loading !== null}
            >
              <Sun className="h-8 w-8 mb-2" />
              <span>Light</span>
              {loading === "light" && <span className="text-xs mt-1">Saving...</span>}
            </Button>
            
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-24 ${
                theme === "dark" ? "border-2 border-primary" : ""
              }`}
              onClick={() => handleThemeChange("dark")}
              disabled={loading !== null}
            >
              <Moon className="h-8 w-8 mb-2" />
              <span>Dark</span>
              {loading === "dark" && <span className="text-xs mt-1">Saving...</span>}
            </Button>
            
            <Button
              variant={theme === "system" ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-24 ${
                theme === "system" ? "border-2 border-primary" : ""
              }`}
              onClick={() => handleThemeChange("system")}
              disabled={loading !== null}
            >
              <Monitor className="h-8 w-8 mb-2" />
              <span>System</span>
              {loading === "system" && <span className="text-xs mt-1">Saving...</span>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeSettings;
