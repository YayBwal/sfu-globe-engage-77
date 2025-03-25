
import { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from '@/types/auth';
import { useAuthOperations } from '@/hooks/useAuthOperations';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    setUser,
    profile,
    loading,
    isAuthenticated,
    isTeacher,
    updateAuthState,
    register,
    login,
    logout,
    updateProfile
  } = useAuthOperations();

  useEffect(() => {
    const session = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    session()

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [setUser])

  useEffect(() => {
    if (user) {
      updateAuthState(user);
    } else {
      updateAuthState(null);
    }
  }, [user, updateAuthState]);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated,
    isTeacher,
    register,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
