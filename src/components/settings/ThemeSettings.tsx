
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
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center dark:text-gray-100">
            <Sun className="mr-2 h-5 w-5 text-sfu-red dark:text-amber-400" /> Appearance
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Choose how SFU Connect looks for you. Select a theme preference.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-28 transition-all duration-300 hover:scale-105 ${
                theme === "light" 
                  ? "border-2 border-primary shadow-md dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400" 
                  : "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-amber-400 dark:hover:text-amber-400"
              }`}
              onClick={() => handleThemeChange("light")}
              disabled={loading !== null}
            >
              <Sun className={`h-8 w-8 mb-2 ${theme === "light" ? "text-amber-400" : ""}`} />
              <span>Light</span>
              {loading === "light" && <span className="text-xs mt-1">Saving...</span>}
            </Button>
            
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-28 transition-all duration-300 hover:scale-105 ${
                theme === "dark" 
                  ? "border-2 border-primary shadow-md dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500" 
                  : "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
              }`}
              onClick={() => handleThemeChange("dark")}
              disabled={loading !== null}
            >
              <Moon className={`h-8 w-8 mb-2 ${theme === "dark" ? "text-blue-400" : ""}`} />
              <span>Dark</span>
              {loading === "dark" && <span className="text-xs mt-1">Saving...</span>}
            </Button>
            
            <Button
              variant={theme === "system" ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-28 transition-all duration-300 hover:scale-105 ${
                theme === "system" 
                  ? "border-2 border-primary shadow-md dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500" 
                  : "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-purple-400 dark:hover:text-purple-400"
              }`}
              onClick={() => handleThemeChange("system")}
              disabled={loading !== null}
            >
              <Monitor className={`h-8 w-8 mb-2 ${theme === "system" ? "text-purple-400" : ""}`} />
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
