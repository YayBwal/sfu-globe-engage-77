
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { updatePassword } from '@/services/authService';
import { PasswordInput } from '@/components/ui/password-input';

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordFormValues>();

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      await updatePassword(data.password);
      
      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error("Password update error:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
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
            Enter your new password below
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <PasswordInput
                id="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters long'
                  }
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
            
            <div className="mt-4 text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
