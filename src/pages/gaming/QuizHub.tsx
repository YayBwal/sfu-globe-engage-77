
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Award, BookOpen, CheckCircle, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const QuizHub = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setQuizzes(data || []);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        toast({
          title: 'Error fetching quizzes',
          description: 'There was a problem loading quizzes. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizzes();
    
    if (isAuthenticated && user) {
      fetchUserResults();
    }
  }, [isAuthenticated, user]);
  
  const fetchUserResults = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*, quizzes(*)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
        
      if (error) throw error;
      setMyResults(data || []);
    } catch (error) {
      console.error('Error fetching user results:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
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
              <Award className="mr-3 h-8 w-8 text-indigo-600" />
              Quiz Hub
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Test your knowledge, earn points, and compete with others through our diverse collection of quizzes
            </p>
          </motion.div>
          
          {isAuthenticated ? (
            <motion.div variants={itemVariants} className="mb-12">
              <Tabs defaultValue="available" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="available" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                    Available Quizzes
                  </TabsTrigger>
                  <TabsTrigger value="my-results" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                    My Results
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="available" className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">Loading quizzes...</p>
                    </div>
                  ) : quizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {quizzes.map((quiz) => (
                        <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-indigo-600" />
                              <span>{quiz.title}</span>
                            </CardTitle>
                            <CardDescription>
                              {quiz.description || 'Test your knowledge with this quiz'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1 text-indigo-600" />
                                <span>{quiz.total_questions} questions</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-indigo-600" />
                                <span>~{Math.ceil(quiz.total_questions * 0.5)} min</span>
                              </div>
                            </div>
                            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                              <Link to={`/gaming/quiz/${quiz.id}`}>Start Quiz</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600">No quizzes available at the moment. Check back later!</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="my-results" className="space-y-4">
                  {myResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left p-3 border-b border-gray-200">Quiz</th>
                            <th className="text-center p-3 border-b border-gray-200">Score</th>
                            <th className="text-center p-3 border-b border-gray-200">Completed</th>
                            <th className="text-right p-3 border-b border-gray-200">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myResults.map((result) => (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="p-3 border-b border-gray-200">{result.quiz_title}</td>
                              <td className="text-center p-3 border-b border-gray-200">
                                <div className="flex items-center justify-center gap-1">
                                  <span>{result.score}/{result.total_questions}</span>
                                  <Star className="h-4 w-4 text-amber-500" />
                                </div>
                              </td>
                              <td className="text-center p-3 border-b border-gray-200">
                                {new Date(result.completed_at).toLocaleDateString()}
                              </td>
                              <td className="text-right p-3 border-b border-gray-200">
                                <Button asChild variant="outline" size="sm">
                                  <Link to={`/gaming/quiz/${result.quiz_id}`}>Retry</Link>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600">You haven't completed any quizzes yet.</p>
                      <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                        <Link to="/gaming/quiz">Take Your First Quiz</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="text-center py-12">
              <p className="text-gray-600 mb-4">Please sign in to view and take quizzes</p>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link to="/login">Sign In</Link>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizHub;
