
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, WifiOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/ui/password-input';

type LoginFormValues = {
  identifier: string;
  password: string;
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setConnectionError(null);
    setLoginError(null);
    
    try {
      await login(data.identifier, data.password);
      // Navigation is handled in the AuthContext
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Improved error handling with more specific messages
      let errorMessage = 'Please check your credentials and try again';
      
      if (error.message?.includes('Network error') || 
          error.message?.includes('Failed to fetch') || 
          error.message?.includes('Unable to connect')) {
        setConnectionError('Unable to connect to the authentication service. Please check your internet connection and try again.');
        errorMessage = 'Connection error';
      } else if (error.message?.includes('Invalid student ID')) {
        setLoginError('Invalid student ID or password. Please verify your credentials and try again.');
        errorMessage = 'Invalid credentials';
      } else if (error.message) {
        setLoginError(error.message);
        errorMessage = error.message;
      }
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {connectionError && (
              <Alert variant="destructive">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            )}
            
            {loginError && (
              <Alert variant="destructive">
                <AlertTitle>Login Error</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Student ID</Label>
              <Input
                id="identifier"
                type="text" 
                placeholder="Email or Student ID"
                {...register('identifier', { 
                  required: 'Email or Student ID is required'
                })}
              />
              {errors.identifier && (
                <p className="text-sm text-red-500">{errors.identifier.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                placeholder="Enter password"
                {...register('password', { 
                  required: 'Password is required' 
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            
            <p className="mt-4 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
