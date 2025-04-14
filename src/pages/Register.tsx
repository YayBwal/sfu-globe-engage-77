
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const passwordSchema = z.string().min(6, { message: 'Password must be at least 6 characters long' });

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
  studentId: z.string().min(3, { message: 'Student ID is required' }),
  major: z.string().min(1, { message: 'Major is required' }),
  batch: z.string().min(1, { message: 'Batch is required' }),
  studentIdPhoto: z.any().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [bucketAvailable, setBucketAvailable] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBucketAccess = async () => {
      try {
        // Try to list buckets to check if we have access
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error("Storage access error:", error);
          setBucketAvailable(false);
          toast({
            title: 'Storage System Unavailable',
            description: 'There was a problem accessing the storage system. Some features may be limited.',
            variant: 'destructive',
          });
          return;
        }
        
        // Check if the profile-images bucket exists
        const bucketExists = data?.some(bucket => bucket.name === 'profile-images');
        setBucketAvailable(bucketExists === true);
        
        if (!bucketExists) {
          console.warn("Profile images bucket not found or not accessible");
          toast({
            title: 'Storage Configuration Issue',
            description: 'The profile images storage is not properly configured. You may continue registration, but photo upload may not work.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error("Error checking storage:", error);
        setBucketAvailable(false);
      }
    };
    
    checkBucketAccess();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      studentId: '',
      major: '',
      batch: '',
      termsAccepted: false,
    },
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    if (!bucketAvailable) {
      toast({
        title: 'Storage Unavailable',
        description: 'Profile image upload is currently unavailable. You may proceed with registration without a photo.',
        variant: 'warning',
      });
      return;
    }
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (jpg, jpeg, png, gif, webp)',
        variant: 'destructive',
      });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const timestamp = new Date().getTime();
      const filePath = `student_id_${timestamp}`;
      
      console.log("Uploading file:", filePath);
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error("Upload failed:", error);
        
        if (error.message.includes("new row violates row-level security policy")) {
          throw new Error("Permission denied: You need to sign in before uploading files.");
        }
        
        throw error;
      }
      
      console.log("Upload successful:", data);
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      
      console.log("Public URL:", publicUrlData.publicUrl);
      setPhotoUrl(publicUrlData.publicUrl);
      
      toast({
        title: 'Upload successful',
        description: 'Your ID photo has been uploaded successfully',
      });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Something went wrong with the upload';
      
      if (error.message && error.message.includes("Permission denied")) {
        // This case should not happen during registration since we're making the bucket publicly writable
        errorMessage = 'You need to be signed in to upload files. Please continue registration without a photo and add it later from your profile.';
      } else if (error.message && error.message.includes("bucket")) {
        errorMessage = 'Storage system not properly configured. Please continue registration without a photo.';
      } else if (error.message && error.message.includes("permission")) {
        errorMessage = 'Storage permissions issue. Please continue registration without a photo and add it later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      console.log("Starting registration with values:", {
        email: values.email,
        name: values.name,
        studentId: values.studentId,
        major: values.major,
        batch: values.batch,
        photo: photoUrl
      });
      
      await registerUser(
        values.email, 
        values.password, 
        values.name, 
        values.studentId, 
        values.major, 
        values.batch,
        photoUrl
      );
      
      toast({
        title: 'Registration successful',
        description: 'Your registration is pending admin approval. You will be notified once approved.',
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Improved error handling with specific messages
      let errorMessage = 'Something went wrong with registration. Please try again.';
      
      if (error.message) {
        if (error.message.includes('already exists')) {
          errorMessage = 'A user with this email or student ID already exists.';
        } else if (error.message.includes('valid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password should be at least 6 characters.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Display a user-friendly error message
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student ID photo display and upload component
  const StudentIdPhotoField = ({ field }: { field: any }) => (
    <div className="border-2 border-dashed rounded-lg p-4 text-center">
      {photoUrl ? (
        <div className="space-y-2">
          <div className="flex justify-center">
            <img 
              src={photoUrl} 
              alt="Student ID" 
              className="max-h-40 rounded-md" 
            />
          </div>
          <Button
            type="button"
            variant="outline" 
            onClick={() => setPhotoUrl(null)}
          >
            Replace Photo
          </Button>
        </div>
      ) : isUploading ? (
        <div className="space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500">Uploading...</p>
        </div>
      ) : (
        <div>
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-400">JPG, PNG, GIF up to 2MB</p>
          <Input
            {...field}
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => {
              document.getElementById('file-upload')?.click();
            }}
            disabled={isUploading}
          >
            Select File
          </Button>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-white to-gray-100">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/f63a18ce-0dc7-4e9f-8efe-f8e2e695c339.png" 
              alt="S1st Logo" 
              className="h-16 w-auto" 
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create an account</h1>
          <p className="mt-2 text-gray-600">Join the student community</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Your student ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Major</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your major" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DC">DC - Diploma in Computing</SelectItem>
                          <SelectItem value="DCBM">DCBM - Computing & Business Management</SelectItem>
                          <SelectItem value="BM">BM - Business Management</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch</FormLabel>
                    <FormControl>
                      <Input placeholder="2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="studentIdPhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID Photo</FormLabel>
                  <FormControl>
                    <StudentIdPhotoField field={field} />
                  </FormControl>
                  <FormDescription>
                    Upload a clear photo of your student ID card. 
                    {!bucketAvailable && " (Optional - you can add it later from your profile)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I accept the terms and conditions
                    </FormLabel>
                    <FormDescription>
                      By registering, you agree to our terms of service and privacy policy.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
