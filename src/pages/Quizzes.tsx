
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Quizzes = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Quizzes content will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quizzes;
