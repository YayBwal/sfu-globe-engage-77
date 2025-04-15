
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AccountSettings from '@/components/settings/AccountSettings';
import { Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-sfu-red" />
          <span className="ml-2 text-lg">Loading profile...</span>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-4">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view and manage your profile</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center md:text-left">My Profile</h1>
        
        {/* Profile content */}
        <div className="w-full">
          <AccountSettings />
        </div>
      </div>
    </Layout>
  );
}
