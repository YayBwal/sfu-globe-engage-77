
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EmailVerification = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium">Verification Email Sent</h2>
            <p className="mt-2 text-gray-600">
              Please check your email inbox and click on the verification link to complete the signup process.
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-600">
              Didn't receive the email? Check your spam folder or request a new verification email.
            </p>
            <Button variant="outline" className="w-full">
              Resend Verification Email
            </Button>
            <Button asChild variant="link">
              <Link to="/login">Back to login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;
