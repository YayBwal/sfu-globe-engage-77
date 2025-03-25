
import React from 'react';
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  color: string;
}

interface UpcomingEventsProps {
  events: Event[];
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
      <h3 className="font-semibold mb-4">Upcoming Events</h3>
      
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className={`border-l-2 border-${event.color} pl-3`}>
            <p className="text-xs text-gray-500">{event.date}</p>
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-gray-600">{event.location}</p>
          </div>
        ))}
      </div>
      
      <Button variant="outline" className="w-full mt-4">
        View All Events
      </Button>
    </div>
  );
};
