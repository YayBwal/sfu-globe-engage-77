import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Link, 
  Lock, 
  Info,
  BookOpen,
  User,
  Calendar,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, addHours } from 'date-fns';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated?: () => void;
}

type SessionFormValues = {
  subject: string;
  date: Date;
  endDate: Date;
  time: string;
  endTime: string;
  location: string;
  type: "online" | "offline";
  description: string;
  password?: string;
  meeting_link?: string;
  isSecure: boolean;
  access_code?: string;
};

const CreateSessionDialog: React.FC<CreateSessionDialogProps> = ({ 
  open, 
  onOpenChange,
  onSessionCreated
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [generatedAccessCode, setGeneratedAccessCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<SessionFormValues>({
    defaultValues: {
      subject: '',
      description: '',
      type: 'offline',
      location: '',
      time: '12:00',
      date: addDays(new Date(), 1),
      endTime: '13:00',
      endDate: addDays(new Date(), 1),
      password: '',
      meeting_link: '',
      isSecure: false,
      access_code: '',
    }
  });
  
  const sessionType = form.watch('type');
  const isSecure = form.watch('isSecure');
  const startDate = form.watch('date');
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2
      } 
    }
  };

  const generateAccessCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    form.setValue('access_code', result);
    setGeneratedAccessCode(result);
  };

  const onSubmit = async (values: SessionFormValues) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to create a study session",
        variant: "destructive",
      });
      navigate('/login?redirect=/study');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Combine date and time for start date
      const dateTime = new Date(values.date);
      const [hours, minutes] = values.time.split(':').map(Number);
      dateTime.setHours(hours, minutes);
      
      // Combine date and time for end date
      const endDateTime = new Date(values.endDate);
      const [endHours, endMinutes] = values.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);
      
      // Prepare data based on session type
      const sessionData = {
        subject: values.subject,
        date: dateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        description: values.description,
        host_id: user.id,
        type: values.type,
        location: values.type === 'offline' ? values.location : null,
        password: values.type === 'online' ? values.password : null,
        meeting_link: values.type === 'online' ? values.meeting_link : null,
        access_code: values.isSecure ? values.access_code : null,
        status: 'active'
      };
      
      // Insert into database
      const { error: insertError } = await supabase
        .from('study_sessions')
        .insert(sessionData);
        
      if (insertError) {
        console.error("Error creating study session:", insertError);
        setError(insertError.message || "Failed to create study session. Please try again.");
        throw insertError;
      }

      setFormSubmitted(true);
      
      setTimeout(() => {
        onOpenChange(false);
        form.reset();
        setFormStep(1);
        setFormSubmitted(false);
        setError(null);

        // Call the onSessionCreated callback to refresh the sessions list
        if (onSessionCreated) {
          onSessionCreated();
        }

        toast({
          title: "Study session created",
          description: "Your study session has been created successfully",
          variant: "default",
        });
      }, 2000);
      
    } catch (error) {
      console.error("Error creating study session:", error);
      
      // Keep the form open so the user can try again or make changes
      setFormSubmitted(false);
      
      // Show error in UI
      if (error instanceof Error) {
        setError(error.message || "Failed to create study session. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      
      // Show toast for immediate feedback
      toast({
        title: "Error",
        description: "Failed to create study session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    form.trigger(['subject', 'date', 'time', 'endDate', 'endTime']);
    const subjectState = form.getFieldState('subject');
    const dateState = form.getFieldState('date');
    const timeState = form.getFieldState('time');
    const endDateState = form.getFieldState('endDate');
    const endTimeState = form.getFieldState('endTime');
    
    if (!subjectState.invalid && !dateState.invalid && !timeState.invalid && 
        !endDateState.invalid && !endTimeState.invalid && 
        form.getValues('subject') && form.getValues('date') && form.getValues('endDate')) {
      setFormStep(2);
    }
  };

  const handleBack = () => {
    setFormStep(1);
  };
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isSubmitting) {
        onOpenChange(newOpen);
        if (!newOpen) {
          // Reset form state when dialog closes
          form.reset();
          setFormStep(1);
          setFormSubmitted(false);
          setError(null);
        }
      }
    }}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <BookOpen className="h-6 w-6 text-sfu-red" />
            {formSubmitted ? "Success!" : "Create Study Session"}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="px-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {formSubmitted ? (
            <motion.div
              key="success"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-6 flex flex-col items-center justify-center"
            >
              <div className="mb-6 bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Your study session has been created!</h3>
              <p className="text-gray-600 text-center mb-6">
                Others will now be able to find and join your session
              </p>
              {isSecure && generatedAccessCode && (
                <div className="w-full max-w-md p-4 bg-amber-50 rounded-lg border border-amber-200 mb-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-1">Secure Access Code</h4>
                      <p className="text-sm text-amber-700 mb-2">
                        Share this code with people you want to invite:
                      </p>
                      <div className="bg-white px-4 py-2 rounded border border-amber-200 font-mono text-lg text-center">
                        {generatedAccessCode}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <motion.div
                  key={`step-${formStep}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="px-6 py-4 space-y-4"
                >
                  <>
                      <FormField
                        control={form.control}
                        name="subject"
                        rules={{ required: "Subject is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Subject</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input 
                                  placeholder="e.g. Calculus 101, Programming Basics" 
                                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="date"
                          rules={{ required: "Start date is required" }}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-sm font-medium">Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal bg-gray-50 border-gray-200 hover:bg-gray-100",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="time"
                          rules={{ required: "Start time is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Start Time</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                  <Input 
                                    type="time" 
                                    className="pl-10 bg-gray-50 border-gray-200"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="endDate"
                          rules={{ 
                            required: "End date is required",
                            validate: (value) => {
                              const startDate = form.getValues('date');
                              const endDate = value;
                              
                              // If end date is before start date, return error
                              if (startDate && endDate && 
                                  endDate.getFullYear() < startDate.getFullYear() || 
                                  (endDate.getFullYear() === startDate.getFullYear() && 
                                   endDate.getMonth() < startDate.getMonth()) ||
                                  (endDate.getFullYear() === startDate.getFullYear() && 
                                   endDate.getMonth() === startDate.getMonth() &&
                                   endDate.getDate() < startDate.getDate())) {
                                return "End date cannot be before start date";
                              }
                              return true;
                            }
                          }}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-sm font-medium">End Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal bg-gray-50 border-gray-200 hover:bg-gray-100",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      field.onChange(date);
                                      // If end date is before start date, update it
                                      if (startDate && date && date < startDate) {
                                        form.setValue('endDate', startDate);
                                      }
                                    }}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endTime"
                          rules={{ required: "End time is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">End Time</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                  <Input 
                                    type="time" 
                                    className="pl-10 bg-gray-50 border-gray-200"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="isSecure"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center">
                                <ShieldCheck className="mr-2 h-4 w-4 text-amber-500" />
                                Secure Study Session
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Restrict access with a passcode that only you can share
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked && !form.getValues('access_code')) {
                                    generateAccessCode();
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {isSecure && (
                        <FormField
                          control={form.control}
                          name="access_code"
                          rules={{ required: "Access code is required for secure sessions" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Access Code</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <div className="relative flex-1">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      placeholder="Access code" 
                                      className="pl-10 bg-gray-50 border-gray-200 font-mono"
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={generateAccessCode}
                                  className="shrink-0"
                                >
                                  Generate
                                </Button>
                              </div>
                              <FormDescription className="text-xs">
                                Only people with this code can join your study session
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  
                  
                    <>
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-sm font-medium">Session Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-2"
                              >
                                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                  <RadioGroupItem value="offline" id="offline" />
                                  <Label htmlFor="offline" className="cursor-pointer">In-Person</Label>
                                </div>
                                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                  <RadioGroupItem value="online" id="online" />
                                  <Label htmlFor="online" className="cursor-pointer">Online</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {sessionType === 'offline' && (
                        <FormField
                          control={form.control}
                          name="location"
                          rules={{ required: "Location is required for in-person sessions" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Location</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                  <Input 
                                    placeholder="e.g. Library Room 204, Campus Center" 
                                    className="pl-10 bg-gray-50 border-gray-200"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {sessionType === 'online' && (
                        <>
                          <FormField
                            control={form.control}
                            name="meeting_link"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Meeting Link (Optional)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Link className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      placeholder="e.g. Zoom, Google Meet link" 
                                      className="pl-10 bg-gray-50 border-gray-200"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription className="text-xs">
                                  You can add this now or share later with participants
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Password (Optional)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      type="text" 
                                      placeholder="Meeting password" 
                                      className="pl-10 bg-gray-50 border-gray-200"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription className="text-xs">
                                  This is different from the access code - it's the password for your meeting service
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Description (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Info className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Textarea 
                                  placeholder="Share details about what you'll be studying, what to bring, etc." 
                                  className="min-h-[80px] pl-10 bg-gray-50 border-gray-200"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  
                </motion.div>
                
                <DialogFooter className="p-6 bg-gray-50 border-t flex justify-between">
                  {formStep === 1 ? (
                    <div className="flex w-full justify-end">
                      <Button 
                        type="button" 
                        onClick={handleNext}
                        className="bg-sfu-red hover:bg-sfu-red/90 w-full sm:w-auto"
                      >
                        Next
                      </Button>
                    </div>
                  ) : (
                    <div className="flex w-full justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleBack}
                        disabled={isSubmitting}
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-sfu-red hover:bg-sfu-red/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Creating..." : "Create Session"}
                      </Button>
                    </div>
                  )}
                </DialogFooter>
              </form>
            </Form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSessionDialog;
