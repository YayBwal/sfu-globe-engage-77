import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FileInput } from '@/components/ui/file-input';

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  studentId: string;
  major: string;
  batch: string;
  studentIdPhoto?: FileList;
};

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>();

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (data.password !== data.confirmPassword) {
        toast({
          title: 'Registration failed',
          description: 'Passwords do not match',
          variant: 'destructive',
        });
        return;
      }

      let studentIdPhotoBase64: string | undefined;
      if (data.studentIdPhoto && data.studentIdPhoto[0]) {
        const file = data.studentIdPhoto[0];
        studentIdPhotoBase64 = await convertFileToBase64(file);
      }

      await registerUser(
        data.email,
        data.password,
        data.name,
        data.studentId,
        data.major,
        data.batch,
        studentIdPhotoBase64
      );
      
      toast({
        title: 'Registration successful',
        description: 'You have successfully registered. Please log in.',
      });
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error.message || 'An error occurred during registration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
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
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                {...register('confirmPassword', {
                  required: 'Confirm password is required',
                  validate: (value) => value === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter your Student ID"
                {...register('studentId', { required: 'Student ID is required' })}
              />
              {errors.studentId && (
                <p className="text-sm text-red-500">{errors.studentId.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                type="text"
                placeholder="Enter your major"
                {...register('major', { required: 'Major is required' })}
              />
              {errors.major && (
                <p className="text-sm text-red-500">{errors.major.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                type="text"
                placeholder="Enter your batch"
                {...register('batch', { required: 'Batch is required' })}
              />
              {errors.batch && (
                <p className="text-sm text-red-500">{errors.batch.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentIdPhoto">Student ID Photo</Label>
              <FileInput
                id="studentIdPhoto"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  register('studentIdPhoto').onChange(target.files);
                }}
              />
              {errors.studentIdPhoto && (
                <p className="text-sm text-red-500">{errors.studentIdPhoto.message}</p>
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
            
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
