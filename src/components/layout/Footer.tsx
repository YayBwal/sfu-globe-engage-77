
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-sfu-black text-white py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10">
                <img src="/lovable-uploads/6b2792e9-40c8-412d-8f43-0d697f2e4cfc.png" alt="S1st Globe Logo" className="h-full w-full object-contain bg-white rounded-lg p-1" />
              </div>
              <span className="font-display font-semibold text-xl text-white">
                S1st Globe
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Connect, learn, and grow with the S1st community.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200">
                <Twitter size={18} className="text-white" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200">
                <Instagram size={18} className="text-white" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200">
                <Github size={18} className="text-white" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-medium text-white mb-4">Features</h3>
            <ul className="space-y-3">
              {['Study Buddy', 'Club Activities', 'Quizzes', 'Attendance Tracking', 'Ranking System', 'Minor Games'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-medium text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              {['Help Center', 'Documentation', 'Privacy Policy', 'Terms of Service', 'Contact Support'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-medium text-white mb-4">Newsletter</h3>
            <p className="text-gray-400 text-sm">Stay updated with the latest features and releases.</p>
            <div className="mt-4">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sfu-red"
              />
              <button className="w-full mt-2 bg-sfu-red hover:bg-sfu-red/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} S1st Globe. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Privacy
            </Link>
            <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Terms
            </Link>
            <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
