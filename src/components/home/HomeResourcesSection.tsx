
import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Users, Calendar, GraduationCap, Bookmark } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const HomeResourcesSection: React.FC = () => {
  const resources = [
    {
      title: "Study Resources",
      description: "Access course materials, study guides, and academic resources to enhance your learning experience.",
      icon: <Book className="h-10 w-10 text-sfu-red" />,
      link: "/study",
      bgClass: "bg-orange-50"
    },
    {
      title: "Campus Clubs",
      description: "Discover and join various student clubs to pursue your interests and build community connections.",
      icon: <Users className="h-10 w-10 text-sfu-red" />,
      link: "/clubs",
      bgClass: "bg-blue-50"
    },
    {
      title: "Events Calendar",
      description: "Stay updated with upcoming campus events, workshops, seminars, and important academic dates.",
      icon: <Calendar className="h-10 w-10 text-sfu-red" />,
      link: "/newsfeed",
      bgClass: "bg-green-50"
    },
    {
      title: "Marketplace",
      description: "Buy, sell, or exchange textbooks, study materials, and other student essentials.",
      icon: <Bookmark className="h-10 w-10 text-sfu-red" />,
      link: "/marketplace",
      bgClass: "bg-purple-50"
    },
  ];

  return (
    <section className="section bg-sfu-lightgray">
      <div className="container-narrow">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Campus Resources
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to make your university experience productive and engaging.
            Explore these resources to enhance your academic journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {resources.map((resource, index) => (
            <Link 
              to={resource.link} 
              key={index}
              className="group block"
            >
              <Card className={`h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${resource.bgClass} border-none overflow-hidden`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="bg-white p-4 rounded-full shadow-sm group-hover:bg-sfu-red transition-colors duration-300">
                      <div className="group-hover:text-white transition-colors duration-300">
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-sfu-red text-white rounded-lg font-medium hover:bg-sfu-red/90 transition-all duration-300"
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
