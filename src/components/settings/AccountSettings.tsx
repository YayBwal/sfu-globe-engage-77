
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/settings/ProfileSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySettings from "@/components/settings/PrivacySettings";
import ThemeSettings from "@/components/settings/ThemeSettings";
import AccountDangerZone from "@/components/settings/AccountDangerZone";
import { cleanupModals, fixSheetOverlays } from "@/utils/eventDebug";
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Lock, 
  Paintbrush, 
  AlertTriangle 
} from "lucide-react";

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  // Clean up any modal overlays when this component mounts and unmounts
  useEffect(() => {
    // Fix any lingering overlays when component mounts
    cleanupModals();
    
    // Also clean up when component unmounts
    return () => {
      cleanupModals();
    };
  }, []);

  const handleTabChange = (value: string) => {
    // Make sure event is completely handled before changing tab
    setTimeout(() => {
      setActiveTab(value);
    }, 0);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={18} />, component: <ProfileSettings /> },
    { id: "security", label: "Security", icon: <ShieldCheck size={18} />, component: <SecuritySettings /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} />, component: <NotificationSettings /> },
    { id: "privacy", label: "Privacy", icon: <Lock size={18} />, component: <PrivacySettings /> },
    { id: "appearance", label: "Appearance", icon: <Paintbrush size={18} />, component: <ThemeSettings /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={18} className="text-red-500" />, component: <AccountDangerZone />, danger: true }
  ];

  return (
    <div className="p-4 max-h-[80vh] overflow-y-auto dark:bg-gray-900">
      <h2 className="text-xl font-semibold mb-6 dark:text-gray-200">Account Settings</h2>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-gray-50 dark:bg-gray-800/70 rounded-lg p-2">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-md transition-all duration-300 ${
                      activeTab === tab.id
                        ? tab.danger
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
                          : "bg-white dark:bg-gray-700 shadow-sm dark:shadow-gray-950 text-sfu-red dark:text-blue-400 font-medium"
                        : "hover:bg-white/80 dark:hover:bg-gray-700/50 dark:text-gray-300"
                    }`}
                    type="button"
                  >
                    <span className={`${activeTab === tab.id && !tab.danger ? "text-sfu-red dark:text-blue-400" : "dark:text-gray-400"}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800/70 rounded-lg p-6 shadow-sm dark:shadow-gray-950/20 border border-gray-100 dark:border-gray-700/50">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
