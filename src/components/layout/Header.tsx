import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMobile } from '@/hooks/useMobile';
import { useNotifications } from '@/contexts/NotificationContext';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Menu, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import AccountSettings from "@/components/settings/AccountSettings";

const Header = () => {
  const { isAuthenticated, profile, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const isMobile = useMobile();
  const { notifications, markAllAsRead } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<string>(location.pathname);
  const isInitialMount = useRef(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    closeMenu();
    
    // Only run the animation after initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    
    // Update immediately without flickering
    setActiveTab(location.pathname);
  }, [location]);

  // Define nav items for consistent rendering and positioning
  const navItems = useMemo(() => {
    const items = [
      { path: '/', label: 'Home' },
      { path: '/study', label: 'Study' },
      { path: '/clubs', label: 'Clubs' },
      { path: '/attendance', label: 'Attendance' },
      { path: '/marketplace', label: 'Marketplace' },
      { path: '/newsfeed', label: 'Newsfeed' },
      { path: '/friends', label: 'Friends' },
    ];
    
    if (isAdmin) {
      items.push({ path: '/admin/review', label: 'Review' });
    }
    
    return items;
  }, [isAdmin]);
  
  // Helper function to determine if a nav item is active
  const isActive = (path: string) => {
    if (path === '/') {
      return activeTab === path;
    }
    return activeTab === path || (path !== '/' && activeTab.startsWith(path));
  };

  // Navigation menu for mobile and desktop
  const NavItems = () => (
    <ul className={`${isMobile ? 'space-y-4' : 'flex space-x-6 relative'}`}>
      {navItems.map((item) => (
        <li 
          key={item.path} 
          className={`${isMobile ? 'transform transition-all duration-200 hover:translate-x-2' : 'relative group nav-static'}`}
        >
          <Link
            to={item.path}
            className={`
              ${isActive(item.path)
                ? 'text-red-600 font-semibold'
                : 'text-gray-600 hover:text-red-600'
              } 
              ${isMobile ? 'block' : 'py-2 block transition-colors duration-300 ease-in-out nav-static'}
            `}
            style={!isMobile ? { transform: 'translateZ(0)' } : undefined}
            onClick={(e) => {
              if (item.path === location.pathname) {
                e.preventDefault(); // Prevent navigation if already on the page
              }
              if (isMobile) {
                closeMenu();
              }
            }}
          >
            {item.label}
            {!isMobile && (
              <span 
                className={`tab-indicator ${isActive(item.path) ? 'tab-indicator-active' : 'tab-indicator-inactive'}`}
                aria-hidden="true"
              />
            )}
          </Link>
        </li>
      ))}
      
      {isMobile && isAuthenticated && (
        <li className="transform transition-all duration-200 hover:translate-x-2 border-t border-gray-100 pt-4 mt-4">
          <button onClick={logout} className="block w-full text-left text-gray-700 hover:text-red-600 font-medium transition-colors duration-300">
            Logout
          </button>
        </li>
      )}
      {isMobile && !isAuthenticated && (
        <>
          <li className="transform transition-all duration-200 hover:translate-x-2 border-t border-gray-100 pt-4 mt-4">
            <Link to="/login" className="block text-gray-700 hover:text-red-600 font-medium transition-colors duration-300">
              Login
            </Link>
          </li>
          <li className="transform transition-all duration-200 hover:translate-x-2">
            <Link to="/register" className="block text-gray-700 hover:text-red-600 font-medium transition-colors duration-300">
              Register
            </Link>
          </li>
        </>
      )}
    </ul>
  );

  return (
    <header className="fixed top-0 z-50 w-full backdrop-blur-sm bg-white/80 border-b border-gray-200 will-change-transform">
      {/* Mobile Menu Overlay */}
      {isMobile && (
        <div className={`fixed top-0 left-0 w-full h-full bg-white z-50 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/f492ef21-ec71-457f-90a9-ae27362a3bc3.png" 
                alt="S1st Globe Logo" 
                className="h-8 w-auto mr-2" 
              />
              <span className="ml-1 text-gray-800 font-semibold">S1st Globe</span>
            </Link>
            <button onClick={toggleMenu} className="p-2 transition-transform duration-200 hover:scale-110">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4 bg-white">
            <NavItems />
          </nav>
        </div>
      )}
      
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center group transition-transform duration-200 hover:scale-105 nav-static" aria-label="Home">
            <img 
              src="/lovable-uploads/f492ef21-ec71-457f-90a9-ae27362a3bc3.png" 
              alt="S1st Globe Logo" 
              className="h-12 w-auto mr-2 transition-all duration-300 pointer-events-none" 
              loading="eager"
              fetchPriority="high"
            />
            <span className="text-lg font-semibold text-gray-800 transition-colors duration-300 group-hover:text-red-600">S1st Globe</span>
          </Link>
        </div>
          
        {isAuthenticated && (
          <nav className={`${isMobile ? 'hidden' : 'block'} mx-auto nav-static`}>
            <NavItems />
          </nav>
        )}
        
        <div className="flex items-center space-x-4">
          
          {isAuthenticated ? (
            <>
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative transition-transform duration-200 hover:scale-110">
                      <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors duration-300" />
                      {unreadCount > 0 && (
                        <span className="absolute top-[-3px] right-[-3px] bg-red-600 text-white rounded-full text-xs px-1 animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 md:w-96 animate-in fade-in-80 slide-in-from-top-5 bg-white">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications && notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id} className="break-words transition-colors duration-200 hover:bg-gray-100">
                          <div className="font-semibold">{notification.title}</div>
                          <div className="text-sm text-gray-500">{notification.message}</div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem className="justify-center">No notifications</DropdownMenuItem>
                    )}
                    {notifications && notifications.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={markAllAsRead} className="justify-center transition-colors duration-200 hover:bg-gray-100">
                          Mark all as read
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none transition-transform duration-200 hover:scale-110">
                    <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-red-400 transition-all duration-300">
                      <AvatarImage src={profile?.profilePic || "https://github.com/shadcn.png"} alt={profile?.name || "Avatar"} />
                      <AvatarFallback>{profile?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 animate-in fade-in-80 slide-in-from-top-5 bg-white">
                  <DropdownMenuLabel>{profile?.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')} 
                    className="transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsSettingsOpen(true)} 
                    className="transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Account Settings Dialog */}
              <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetContent side="right" className="sm:max-w-md w-full">
                  <SheetHeader>
                    <SheetTitle className="text-left">Account Settings</SheetTitle>
                  </SheetHeader>
                  <AccountSettings />
                </SheetContent>
              </Sheet>

              {/* Mobile hamburger menu for authenticated users */}
              {isMobile && (
                <button onClick={toggleMenu} className="p-2 transition-transform duration-200 hover:scale-110">
                  <Menu className="h-6 w-6" />
                </button>
              )}
            </>
          ) : (
            !isMobile ? (
              <div>
                <Link to="/login" className="text-gray-600 hover:text-red-600 mr-4 transition-colors duration-300 hover:underline">
                  Login
                </Link>
                <Link to="/register" className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-all duration-300 hover:shadow-md transform hover:scale-105">
                  Register
                </Link>
              </div>
            ) : (
              <button onClick={toggleMenu} className="p-2 transition-transform duration-200 hover:scale-110">
                <Menu className="h-6 w-6" />
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
