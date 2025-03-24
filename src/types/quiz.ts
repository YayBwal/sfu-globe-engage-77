export type QuizResult = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  user_name: string;
  quiz_title: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  created_at: string;
  created_by: string;
}; 