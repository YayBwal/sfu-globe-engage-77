
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { resetPassword } from '@/services/authService';

type ForgotPasswordFormValues = {
  email: string;
};

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>();

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        
        {!emailSent ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address"
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
              
              <div className="mt-4 text-center text-sm">
                <Link to="/login" className="text-blue-600 hover:underline">
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4 text-center">
            <div className="py-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-lg font-medium">Check your inbox</p>
              <p className="mt-2 text-gray-600">
                We've sent you an email with a link to reset your password.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to login</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
