
import React, { useState, useEffect } from 'react';
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

const Header = () => {
  const { isAuthenticated, profile, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const isMobile = useMobile();
  const { notifications, markAllAsRead } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    closeMenu();
  }, [location]);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-white/80 border-b border-gray-200">
      {isMobile && (
        <div className={`fixed top-0 left-0 w-full h-full bg-white z-50 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/534fee46-9698-4758-b6e0-0ab24e892ec4.png" 
                alt="S1st Globe Logo" 
                className="h-8 w-auto mr-2" 
              />
              <span className="ml-1 text-gray-800 font-semibold">S1st Globe</span>
            </Link>
            <button onClick={toggleMenu} className="p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4">
            <ul className="space-y-4">
              <li>
                <Link to="/" className="block text-gray-700 hover:text-red-600 font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/study" className="block text-gray-700 hover:text-red-600 font-medium">
                  Study
                </Link>
              </li>
              <li>
                <Link to="/clubs" className="block text-gray-700 hover:text-red-600 font-medium">
                  Clubs
                </Link>
              </li>
              <li>
                <Link to="/attendance" className="block text-gray-700 hover:text-red-600 font-medium">
                  Attendance
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="block text-gray-700 hover:text-red-600 font-medium">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/newsfeed" className="block text-gray-700 hover:text-red-600 font-medium">
                  Newsfeed
                </Link>
              </li>
              <li>
                <Link to="/friends" className="block text-gray-700 hover:text-red-600 font-medium">
                  Friends
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin/review" className="block text-gray-700 hover:text-red-600 font-medium">
                    Review
                  </Link>
                </li>
              )}
              {isAuthenticated ? (
                <li>
                  <button onClick={logout} className="block text-gray-700 hover:text-red-600 font-medium">
                    Logout
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="block text-gray-700 hover:text-red-600 font-medium">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="block text-gray-700 hover:text-red-600 font-medium">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      )}
      
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/534fee46-9698-4758-b6e0-0ab24e892ec4.png" 
              alt="S1st Globe Logo" 
              className="h-10 w-auto mr-2" 
            />
            <span className="font-bold text-xl text-red-600">S1st</span>
            <span className="ml-1 text-gray-800 font-semibold">Globe</span>
          </Link>
          
          {isAuthenticated && !isMobile && (
            <nav className="ml-8">
              <ul className="flex space-x-6">
                <li>
                  <Link
                    to="/"
                    className={`${
                      location.pathname === '/'
                        ? 'text-red-600 font-semibold border-red-600'
                        : 'text-gray-600 hover:text-red-600 border-transparent'
                    } border-b-2 pb-1 transition-colors`}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/study"
                    className={`${
                      location.pathname === '/study'
                        ? 'text-red-600 font-semibold border-red-600'
                        : 'text-gray-600 hover:text-red-600 border-transparent'
                    } border-b-2 pb-1 transition-colors`}
                  >
                    Study
                  </Link>
                </li>
                <li>
                  <Link
                    to="/clubs"
                    className={`${
                      location.pathname.startsWith('/clubs')
                        ? 'text-red-600 font-semibold border-red-600'
                        : 'text-gray-600 hover:text-red-600 border-transparent'
                    } border-b-2 pb-1 transition-colors`}
                  >
                    Clubs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/attendance"
                    className={`${
                      location.pathname === '/attendance'
                        ? 'text-red-600 font-semibold border-red-600'
                        : 'text-gray-600 hover:text-red-600 border-transparent'
                    } border-b-2 pb-1 transition-colors`}
                  >
                    Attendance
                  </Link>
                </li>
                <li>
                  <Link
                    to="/marketplace"
                    className={`${
                      location.pathname === '/marketplace'
                        ? 'text-red-600 font-semibold border-red-600'
                        : 'text-gray-600 hover:text-red-600 border-transparent'
                    } border-b-2 pb-1 transition-colors`}
                  >
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link
                    to="/newsfeed"
                    className={`${
                      location.pathname === '/newsfeed'
                        ? 'text-red-600 font-semibold border-red-600'
                        : 'text-gray-600 hover:text-red-600 border-transparent'
                    } border-b-2 pb-1 transition-colors`}
                  >
                    Newsfeed
                  </Link>
                </li>
                <li>
                  <Link
                    to="/friends"
                    className={`${
                      location.pathname === '/friends'
                        ? 'text-red-600 font-semibold border-red-600'
                        : 'text-gray-600 hover:text-red-600 border-transparent'
                    } border-b-2 pb-1 transition-colors`}
                  >
                    Friends
                  </Link>
                </li>
                
                {isAdmin && (
                  <li>
                    <Link
                      to="/admin/review"
                      className={`${
                        location.pathname === '/admin/review'
                          ? 'text-red-600 font-semibold border-red-600'
                          : 'text-gray-600 hover:text-red-600 border-transparent'
                      } border-b-2 pb-1 transition-colors`}
                    >
                      Review
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative">
                      <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                      {unreadCount > 0 && (
                        <span className="absolute top-[-3px] right-[-3px] bg-red-600 text-white rounded-full text-xs px-1">{unreadCount}</span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 md:w-96">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications && notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id} className="break-words">
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
                        <DropdownMenuItem onClick={markAllAsRead} className="justify-center">Mark all as read</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.profilePic || "https://github.com/shadcn.png"} alt={profile?.name || "Avatar"} />
                      <AvatarFallback>{profile?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>{profile?.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            !isMobile ? (
              <div>
                <Link to="/login" className="text-gray-600 hover:text-red-600 mr-4">
                  Login
                </Link>
                <Link to="/register" className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors">
                  Register
                </Link>
              </div>
            ) : (
              <button onClick={toggleMenu} className="p-2">
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
