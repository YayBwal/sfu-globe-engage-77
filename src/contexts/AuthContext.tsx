
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  major: string;
  batch: string;
  profilePic?: string;
  bio?: string;
  interests?: string[];
  availability?: string;
  online?: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (studentId: string, password: string) => Promise<void>;
  register: (userData: Omit<User, "id"> & { password: string }) => Promise<void>;
  logout: () => void;
  updateUserStatus: (online: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
      
      // Set online status
      updateUserStatus(true);
      
      // Set offline status when user closes the tab/window
      window.addEventListener('beforeunload', () => {
        updateUserStatus(false);
      });
    }
  }, []);

  const login = async (studentId: string, password: string) => {
    // In a real app, this would verify credentials with a backend
    try {
      // Mock login for demo purposes
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = storedUsers.find((u: any) => 
        u.studentId === studentId && u.password === password
      );
      
      if (!foundUser) {
        throw new Error("Invalid credentials");
      }
      
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Add online status
      const userWithStatus = {
        ...userWithoutPassword,
        online: true
      };
      
      setUser(userWithStatus);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userWithStatus));
      
      // Update user in users array with online status
      const updatedUsers = storedUsers.map((u: any) => {
        if (u.studentId === studentId) {
          return { ...u, online: true };
        }
        return u;
      });
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${foundUser.name}!`,
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const register = async (userData: Omit<User, "id"> & { password: string }) => {
    try {
      // In a real app, this would send data to a backend
      // Mock registration for demo purposes
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        online: true,
        bio: userData.bio || `I'm a ${userData.major} student`,
        interests: userData.interests || [`${userData.major} studies`],
        availability: userData.availability || "Weekdays after classes",
      };
      
      // Store user in localStorage (only for demo)
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Check if student ID already exists
      if (storedUsers.some((u: any) => u.studentId === userData.studentId)) {
        throw new Error("Student ID already registered");
      }
      
      // Check if email already exists
      if (storedUsers.some((u: any) => u.email === userData.email)) {
        throw new Error("Email already registered");
      }
      
      storedUsers.push(newUser);
      localStorage.setItem("users", JSON.stringify(storedUsers));
      
      // Login the user after registration
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = (online: boolean) => {
    if (!user) return;
    
    // Update current user status
    const updatedUser = { ...user, online };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    // Update user in users array
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = storedUsers.map((u: any) => {
      if (u.studentId === user.studentId) {
        return { ...u, online };
      }
      return u;
    });
    localStorage.setItem("users", JSON.stringify(updatedUsers));
  };

  const logout = () => {
    if (user) {
      // Set user offline before logging out
      updateUserStatus(false);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, updateUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
