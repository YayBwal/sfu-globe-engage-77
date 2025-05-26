
import { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface GuestProfile {
  id: string;
  name: string;
  isGuest: true;
  email?: string;
}

interface GuestContextType {
  guestProfile: GuestProfile | null;
  createGuestProfile: (name: string, email?: string) => void;
  clearGuestProfile: () => void;
  isGuest: boolean;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(() => {
    // Check localStorage for existing guest profile
    const stored = localStorage.getItem('guestProfile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('guestProfile');
      }
    }
    return null;
  });

  const createGuestProfile = useCallback((name: string, email?: string) => {
    const profile: GuestProfile = {
      id: uuidv4(),
      name,
      email,
      isGuest: true,
    };
    
    setGuestProfile(profile);
    localStorage.setItem('guestProfile', JSON.stringify(profile));
  }, []);

  const clearGuestProfile = useCallback(() => {
    setGuestProfile(null);
    localStorage.removeItem('guestProfile');
  }, []);

  const value: GuestContextType = {
    guestProfile,
    createGuestProfile,
    clearGuestProfile,
    isGuest: !!guestProfile,
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
};

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
};
