
import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Users, Calendar, GraduationCap, Bookmark, HelpCircle, Trophy, Gamepad, CalendarCheck } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const HomeResourcesSection: React.FC = () => {
  const resources = [
    {
      title: "Study Resources",
      description: "Access course materials, study guides, and academic resources to enhance your learning experience.",
      icon: <Book className="h-10 w-10" />,
      link: "/study",
      bgClass: "bg-orange-50"
    },
    {
      title: "Campus Clubs",
      description: "Discover and join various student clubs to pursue your interests and build community connections.",
      icon: <Users className="h-10 w-10" />,
      link: "/clubs",
      bgClass: "bg-blue-50"
    },
    {
      title: "Events Calendar",
      description: "Stay updated with upcoming campus events, workshops, seminars, and important academic dates.",
      icon: <Calendar className="h-10 w-10" />,
      link: "/newsfeed",
      bgClass: "bg-green-50"
    },
    {
      title: "Marketplace",
      description: "Buy, sell, or exchange textbooks, study materials, and other student essentials.",
      icon: <Bookmark className="h-10 w-10" />,
      link: "/marketplace",
      bgClass: "bg-purple-50"
    },
    {
      title: "Interactive Quizzes",
      description: "Test your knowledge with engaging quizzes designed to reinforce learning.",
      icon: <HelpCircle className="h-10 w-10" />,
      link: "/gaming/quiz",
      bgClass: "bg-pink-50"
    },
    {
      title: "Attendance Tracking",
      description: "Never miss a class with our sophisticated attendance tracking system.",
      icon: <CalendarCheck className="h-10 w-10" />,
      link: "/attendance",
      bgClass: "bg-yellow-50"
    }
  ];

  return (
    <section id="resources" className="section bg-gradient-to-b from-white to-sfu-lightgray py-20">
      <div className="container-narrow">
        <div className="text-center mb-16">
          <span className="pill bg-sfu-red/10 text-sfu-red mb-4 inline-block">Resources</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Campus Resources</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to make your university experience productive and engaging.
            Explore these resources to enhance your academic journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <Link 
              to={resource.link} 
              key={index}
              className="group block transform transition-all duration-300 hover:-translate-y-1"
            >
              <Card className={`h-full transition-all duration-300 hover:shadow-md ${resource.bgClass} border-none overflow-hidden`}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-start">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:bg-sfu-red transition-colors duration-300">
                      <div className="text-sfu-red group-hover:text-white transition-colors duration-300">
                        {resource.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                      <p className="text-gray-600">{resource.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link 
            to="/study" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-sfu-red text-white rounded-lg font-medium hover:bg-sfu-red/90 transition-all duration-300 transform hover:scale-105"
          >
            <GraduationCap size={20} />
            Explore All Resources
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeResourcesSection;
