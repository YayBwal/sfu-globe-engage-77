import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Gamepad, CalendarCheck, ShoppingBag, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Study', path: '/study' },
    { name: 'Clubs', path: '/clubs' },
    { name: 'Gaming Hub', path: '/gaming-hub' },
    { name: 'Attendance', path: '/attendance' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Newsfeed', path: '/newsfeed' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 md:px-8",
        isScrolled 
          ? "bg-white/80 backdrop-blur-md border-b border-gray-200/50 py-3" 
          : "bg-transparent py-6"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center space-x-2"
        >
          <div className="h-10 w-10">
            <img src="/lovable-uploads/6b2792e9-40c8-412d-8f43-0d697f2e4cfc.png" alt="S1st Globe Logo" className="h-full w-full object-contain" />
          </div>
          <span className={cn(
            "font-display font-semibold text-xl transition-all duration-300",
            isScrolled ? "text-sfu-black" : "text-sfu-black"
          )}>
            S1st Globe
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-sm font-medium transition-all duration-200 hover:text-sfu-red relative",
                isScrolled ? "text-sfu-black" : "text-sfu-black",
                isActive(item.path) ? "text-sfu-red" : "",
                "after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-sfu-red after:left-0 after:-bottom-1 after:transition-all after:duration-300 hover:after:w-full",
                isActive(item.path) ? "after:w-full" : ""
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated && <NotificationDropdown />}
          
          {isAuthenticated ? (
            <Link to="/profile">
              <Avatar className="h-9 w-9 border-2 border-white hover:border-sfu-red transition-colors">
                <AvatarImage src={profile?.profilePic} />
                <AvatarFallback className="bg-sfu-red text-white">
                  {profile?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="px-4 py-2 rounded-lg bg-sfu-red text-white text-sm font-medium hover:bg-sfu-red/90 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        <button 
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-sfu-lightgray text-sfu-black"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        "fixed inset-0 z-40 bg-white p-4 pt-20 transform transition-transform duration-300 ease-in-out md:hidden",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <nav className="flex flex-col space-y-6 items-center">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-lg font-medium transition-all duration-200",
                isActive(item.path) ? "text-sfu-red" : "text-sfu-black hover:text-sfu-red"
              )}
            >
              {item.name}
            </Link>
          ))}
          
          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="text-lg font-medium text-sfu-black hover:text-sfu-red transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-lg font-medium text-sfu-black hover:text-sfu-red transition-all duration-200"
              >
                Register
              </Link>
            </>
          )}
          
          <div className="pt-6 border-t border-gray-100 w-full flex justify-center space-x-4">
            <Link 
              to="/marketplace" 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-sfu-lightgray text-sfu-black hover:bg-sfu-lightgray/80 transition-all duration-200"
            >
              <ShoppingBag size={20} />
            </Link>
            <Link 
              to="/newsfeed" 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-sfu-lightgray text-sfu-black hover:bg-sfu-lightgray/80 transition-all duration-200"
            >
              <Radio size={20} />
            </Link>
            <Link 
              to="/games" 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-sfu-lightgray text-sfu-black hover:bg-sfu-lightgray/80 transition-all duration-200"
            >
              <Gamepad size={20} />
            </Link>
            <Link 
              to="/attendance" 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-sfu-lightgray text-sfu-black hover:bg-sfu-lightgray/80 transition-all duration-200"
            >
              <CalendarCheck size={20} />
            </Link>
            {isAuthenticated && <NotificationDropdown />}
            {isAuthenticated ? (
              <Link 
                to="/profile" 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-sfu-lightgray text-sfu-black hover:bg-sfu-lightgray/80 transition-all duration-200"
              >
                <User size={20} />
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
