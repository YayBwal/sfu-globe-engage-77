
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6 text-center space-y-6">
          <h1 className="text-3xl font-bold">Welcome to Student Portal</h1>
          <p className="text-gray-600">Connect with peers, join clubs, and access resources all in one place.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPage;
