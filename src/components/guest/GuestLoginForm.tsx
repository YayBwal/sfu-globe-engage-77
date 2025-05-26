
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGuest } from '@/contexts/GuestContext';
import { useToast } from '@/hooks/use-toast';

const GuestLoginForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { createGuestProfile } = useGuest();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to continue as guest',
        variant: 'destructive',
      });
      return;
    }

    createGuestProfile(name.trim(), email.trim() || undefined);
    
    toast({
      title: 'Welcome!',
      description: 'You are now browsing as a guest user',
    });
    
    navigate('/');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Continue as Guest</CardTitle>
        <CardDescription>
          Browse and explore without creating an account. Note: messaging and friend features are not available for guests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">Your Name *</Label>
            <Input
              id="guestName"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email (Optional)</Label>
            <Input
              id="guestEmail"
              type="email"
              placeholder="Enter your email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <Button type="submit" className="w-full">
            Continue as Guest
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GuestLoginForm;
