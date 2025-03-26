import React from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BarChart, Trophy, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Leaderboard = () => {
  const { isAuthenticated, user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <BarChart className="mr-3 h-8 w-8 text-amber-600" />
              Leaderboard
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See who's on top and track your ranking
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass rounded-xl p-8 mb-12 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-amber-100 rounded-full p-5">
                <Trophy className="h-12 w-12 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Compete for the top spot!</h3>
                <p className="text-gray-600 mb-4">
                  The leaderboard ranks players based on their total points earned from quizzes and mini-games.
                  Compete with friends and other players to climb the rankings and prove your skills.
                </p>
                {isAuthenticated ? (
                  <Button>View Your Ranking</Button>
                ) : (
                  <Button>Sign in to View</Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;

