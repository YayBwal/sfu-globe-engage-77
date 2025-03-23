
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Camera, Edit2, Calendar, Book, Users, Award, Gamepad, Clock, ArrowLeft } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";

const Profile = () => {
  const { profile, user, logout } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">You are not logged in</h2>
          <p className="mb-6">Please log in to view your profile</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const stats = [
    { icon: Book, label: "Classes", value: "12" },
    { icon: Clock, label: "Hours", value: "156" },
    { icon: Award, label: "Rank", value: "#24" },
    { icon: Users, label: "Clubs", value: "3" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-sfu-black hover:text-sfu-red mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="h-40 bg-gradient-to-r from-sfu-red to-sfu-red/60 relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-4 right-4 text-white hover:bg-white/20"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Cover
              </Button>
            </div>
            
            <div className="px-6 pb-6 pt-0 -mt-16 relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white bg-sfu-lightgray">
                    <AvatarImage src={profile?.profilePic} alt={profile?.name} />
                    <AvatarFallback className="text-3xl font-medium bg-sfu-red text-white">
                      {profile ? getInitials(profile.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-sfu-red text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-display font-bold mt-2">{profile?.name}</h1>
                  <p className="text-gray-500">{profile?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {profile?.major === 'CS' ? 'Computer Science' : 
                       profile?.major === 'BBA' ? 'Business Administration' : 
                       profile?.major === 'ENG' ? 'Engineering' : 
                       profile?.major === 'MED' ? 'Medical Sciences' : 
                       profile?.major === 'ART' ? 'Arts & Humanities' : 'Other'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Batch {profile?.batch}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      ID: {profile?.studentId}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Button 
                    variant="outline" 
                    className="hover:bg-gray-100 hover:text-sfu-black"
                    onClick={logout}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-none shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <stat.icon className="h-6 w-6 text-sfu-red mb-2" />
                      <p className="text-2xl font-semibold">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="activity">
            <TabsList className="w-full bg-white mb-6 p-1 rounded-lg">
              <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
              <TabsTrigger value="clubs" className="flex-1">Clubs</TabsTrigger>
              <TabsTrigger value="quizzes" className="flex-1">Quizzes</TabsTrigger>
              <TabsTrigger value="attendance" className="flex-1">Attendance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="bg-white rounded-xl p-6 mt-0">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">No recent activity</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Your recent activities will appear here as you engage with classes, clubs, and quizzes.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="clubs" className="bg-white rounded-xl p-6 mt-0">
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">No clubs joined yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Join clubs to connect with other students and participate in engaging activities.
                </p>
                <Button className="mt-4 bg-sfu-red hover:bg-sfu-red/90">
                  Browse Clubs
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="quizzes" className="bg-white rounded-xl p-6 mt-0">
              <div className="text-center py-12">
                <Book className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">No quizzes taken yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Complete quizzes to test your knowledge and improve your ranking.
                </p>
                <Button className="mt-4 bg-sfu-red hover:bg-sfu-red/90">
                  Start a Quiz
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="attendance" className="bg-white rounded-xl p-6 mt-0">
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">No attendance records</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Your attendance records for classes and events will appear here.
                </p>
                <Button className="mt-4 bg-sfu-red hover:bg-sfu-red/90">
                  Track Attendance
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
