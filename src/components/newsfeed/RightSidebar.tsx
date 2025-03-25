
import React from 'react';
import { UpcomingEvents } from './UpcomingEvents';
import { QuickLinks } from './QuickLinks';

// Sample events
const UPCOMING_EVENTS = [
  {
    id: '1',
    date: 'Tomorrow, 3:00 PM',
    title: 'Graduation Photoshoot',
    location: 'Main Campus, Building A',
    color: 'sfu-red'
  },
  {
    id: '2',
    date: 'May 15, 9:00 AM',
    title: 'Career Fair 2023',
    location: 'Student Center',
    color: 'blue-500'
  },
  {
    id: '3',
    date: 'May 18, 6:30 PM',
    title: 'International Food Festival',
    location: 'University Park',
    color: 'green-500'
  }
];

// Sample quick links
const QUICK_LINKS = [
  { title: 'Academic Calendar', url: '#' },
  { title: 'Library Resources', url: '#' },
  { title: 'Course Catalog', url: '#' },
  { title: 'Student Handbook', url: '#' },
  { title: 'Campus Map', url: '#' }
];

export const RightSidebar: React.FC = () => {
  return (
    <div className="hidden lg:block lg:col-span-1">
      <UpcomingEvents events={UPCOMING_EVENTS} />
      
      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <QuickLinks links={QUICK_LINKS} />
      </div>
    </div>
  );
};
