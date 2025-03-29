
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Award, BookOpen, CheckCircle, Clock, Star, ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Sample quiz data
const sampleQuizzes = [
  {
    id: "1",
    title: "Academic Skills Quiz",
    description: "Test your knowledge about effective study techniques",
    total_questions: 10,
    questions: [
      {
        id: "q1",
        question: "What study technique involves recalling information from memory?",
        options: ["Mind mapping", "Active recall", "Highlighting", "Summarizing"],
        correct_answer: 1
      },
      {
        id: "q2",
        question: "Which of these is NOT a recommended way to prepare for exams?",
        options: ["Studying in short bursts", "Cramming the night before", "Practicing with past papers", "Teaching the material to someone else"],
        correct_answer: 1
      },
      {
        id: "q3",
        question: "What is the Pomodoro Technique?",
        options: ["A method of memorization", "A way to organize notes", "A time management method with work and break intervals", "A group study approach"],
        correct_answer: 2
      }
    ]
  },
  {
    id: "2",
    title: "Campus Knowledge",
    description: "How well do you know your university campus?",
    total_questions: 8,
    questions: [
      {
        id: "q1",
        question: "Which building typically houses student services?",
        options: ["Administration Building", "Science Center", "Sports Complex", "Library"],
        correct_answer: 0
      },
      {
        id: "q2",
        question: "Where would you typically go to print documents on campus?",
        options: ["Cafeteria", "Computer Lab", "Dormitory", "Bookstore"],
        correct_answer: 1
      },
      {
        id: "q3",
        question: "Which campus resource offers mental health counseling?",
        options: ["Financial Aid Office", "Student Health Center", "Career Services", "Alumni Office"],
        correct_answer: 1
      }
    ]
  }
];

// Sample quiz results
const sampleResults = [
  {
    id: "res1",
    user_id: "user1",
    quiz_id: "1",
    quiz_title: "Academic Skills Quiz",
    score: 8,
    total_questions: 10,
    completed_at: "2025-03-15T14:30:00Z"
  },
  {
    id: "res2",
    user_id: "user1",
    quiz_id: "2",
    quiz_title: "Campus Knowledge",
    score: 7,
    total_questions: 8,
    completed_at: "2025-03-20T10:15:00Z"
  }
];

const QuizHub = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quizzes, setQuizzes] = useState(sampleQuizzes);
  const [myResults, setMyResults] = useState(sampleResults);
  const [loading, setLoading] = useState(false);
  
  // Quiz taking state
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  useEffect(() => {
    if (id) {
      const quiz = quizzes.find(q => q.id === id);
      if (quiz) {
        startQuiz(quiz);
      } else {
        navigate('/gaming/quiz');
        toast({
          title: "Quiz not found",
          description: "The requested quiz couldn't be found.",
          variant: "destructive",
        });
      }
    }
  }, [id, quizzes]);
  
  const startQuiz = (quiz: any) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizCompleted(false);
    setTimeRemaining(quiz.total_questions * 30); // 30 seconds per question
    
    // Start the timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Clean up timer on unmount
    return () => clearInterval(timer);
  };
  
  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null) return; // Prevent changing answer
    setSelectedOption(optionIndex);
    
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    
    if (optionIndex === currentQuestion.correct_answer) {
      setQuizScore(prevScore => prevScore + 1);
      toast({
        title: "Correct!",
        description: "You got the right answer!",
        variant: "default",
      });
    } else {
      toast({
        title: "Incorrect",
        description: `The correct answer was: ${currentQuestion.options[currentQuestion.correct_answer]}`,
        variant: "destructive",
      });
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      completeQuiz();
    }
  };
  
  const completeQuiz = () => {
    setQuizCompleted(true);
    
    // Calculate final score
    const scorePercentage = (quizScore / currentQuiz.questions.length) * 100;
    let message;
    
    if (scorePercentage >= 80) {
      message = "Excellent job! You really know your stuff!";
    } else if (scorePercentage >= 60) {
      message = "Good work! You've got a solid understanding.";
    } else {
      message = "Nice effort! Keep practicing to improve your score.";
    }
    
    toast({
      title: "Quiz Completed!",
      description: message,
      variant: "default",
    });
    
    // In a real app, we'd save the result to the database
    const newResult = {
      id: `res${Date.now()}`,
      user_id: user?.id || "guest",
      quiz_id: currentQuiz.id,
      quiz_title: currentQuiz.title,
      score: quizScore,
      total_questions: currentQuiz.questions.length,
      completed_at: new Date().toISOString()
    };
    
    // For this demo, we'll just add it to the local state
    if (isAuthenticated) {
      setMyResults([newResult, ...myResults]);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
          {currentQuiz ? (
            // Quiz taking view
            <motion.div variants={itemVariants}>
              <div className="flex items-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setCurrentQuiz(null);
                    navigate('/gaming/quiz');
                  }}
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Quizzes
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {currentQuiz.title}
                </h1>
              </div>
              
              {quizCompleted ? (
                // Quiz results
                <Card className="mb-8">
                  <CardContent className="pt-6 pb-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-indigo-600">
                          {quizScore}/{currentQuiz.questions.length}
                        </span>
                        <p className="text-gray-600">
                          ({Math.round((quizScore / currentQuiz.questions.length) * 100)}%)
                        </p>
                      </div>
                      
                      <div className="mb-8">
                        {quizScore === currentQuiz.questions.length ? (
                          <div className="flex flex-col items-center mb-4">
                            <div className="bg-green-100 p-3 rounded-full mb-2">
                              <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="font-medium text-green-800">Perfect Score! Amazing job!</p>
                          </div>
                        ) : quizScore >= Math.ceil(currentQuiz.questions.length * 0.7) ? (
                          <div className="flex flex-col items-center mb-4">
                            <div className="bg-green-100 p-3 rounded-full mb-2">
                              <Star className="h-8 w-8 text-amber-500" />
                            </div>
                            <p className="font-medium text-green-800">Great job! You did very well.</p>
                          </div>
                        ) : quizScore >= Math.ceil(currentQuiz.questions.length * 0.5) ? (
                          <div className="flex flex-col items-center mb-4">
                            <div className="bg-blue-100 p-3 rounded-full mb-2">
                              <Award className="h-8 w-8 text-blue-600" />
                            </div>
                            <p className="font-medium text-blue-800">Good effort! Keep practicing.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center mb-4">
                            <div className="bg-orange-100 p-3 rounded-full mb-2">
                              <AlertCircle className="h-8 w-8 text-orange-600" />
                            </div>
                            <p className="font-medium text-orange-800">You can do better! Try again.</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => startQuiz(currentQuiz)}>
                          Try Again
                        </Button>
                        <Button onClick={() => {
                          setCurrentQuiz(null);
                          navigate('/gaming/quiz');
                        }}>
                          Back to Quizzes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Quiz questions
                <Card className="mb-8">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium">
                        Question {currentQuestionIndex + 1}/{currentQuiz.questions.length}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Clock size={14} className="text-gray-500" />
                        <span className={`${timeRemaining < 30 ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatTime(timeRemaining)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-medium mb-6">
                      {currentQuiz.questions[currentQuestionIndex].question}
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      {currentQuiz.questions[currentQuestionIndex].options.map((option: string, index: number) => (
                        <div 
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 
                            ${selectedOption === index 
                              ? index === currentQuiz.questions[currentQuestionIndex].correct_answer
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-indigo-500'
                            }`}
                          onClick={() => handleOptionSelect(index)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {selectedOption === index && (
                              index === currentQuiz.questions[currentQuestionIndex].correct_answer
                                ? <CheckCircle size={20} className="text-green-500" />
                                : <AlertCircle size={20} className="text-red-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full"
                      disabled={selectedOption === null}
                      onClick={handleNextQuestion}
                    >
                      {currentQuestionIndex < currentQuiz.questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                    
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                      <div>Score: {quizScore} correct</div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>Time left: {formatTime(timeRemaining)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            // Quiz hub view
            <>
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
            </>
          )}
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizHub;
