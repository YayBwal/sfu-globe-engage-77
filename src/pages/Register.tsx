import React from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User, GraduationCap, School, Mail, Lock, UserCircle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  studentId: z.string().min(5, { message: "Student ID must be at least 5 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  major: z.string({ required_error: "Please select your major." }),
  batch: z.string({ required_error: "Please enter your batch." })
});

const Register = () => {
  const { register: registerUser } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      studentId: "",
      email: "",
      password: "",
      major: "",
      batch: ""
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerUser({
      name: values.name,
      email: values.email,
      password: values.password,
      studentId: values.studentId,
      major: values.major,
      batch: values.batch,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex flex-col items-center justify-center p-4">
      <Link to="/" className="absolute top-4 left-4 text-sfu-black hover:text-sfu-red transition-colors">
        <ArrowLeft className="h-6 w-6" />
        <span className="sr-only">Back to home</span>
      </Link>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-sfu-red rounded-xl flex items-center justify-center mb-4">
            <UserCircle className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-sfu-black">Join SFU Globe</h1>
          <p className="text-gray-500 mt-2">Create your account to get started</p>
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
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="John Doe" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <School className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="e.g. 301462789" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Major</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <GraduationCap className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Select major" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DC">DC</SelectItem>
                        <SelectItem value="DCBM">DCBM</SelectItem>
                        <SelectItem value="BM">BM</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input 
                        type="text" 
                        placeholder="e.g. 2023" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input type="email" placeholder="name@example.com" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input type="password" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-sfu-red hover:bg-sfu-red/90">
              Create Account
            </Button>
          </form>
        </Form>
        
        <div className="text-center text-sm">
          <p className="text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-sfu-red font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
