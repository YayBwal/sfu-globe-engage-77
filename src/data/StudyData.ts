
// Sample study data
export const allStudentsData = [
  { 
    id: 1, 
    name: "Arya Pratama", 
    studentId: "2024D5963", 
    course: "CMPT 120", 
    major: "DC", 
    batch: "2024", 
    avatar: "", 
    bio: "Passionate about AI and Machine Learning. Looking for study partners for algorithm practice.",
    interests: ["Programming", "Artificial Intelligence", "Data Science"],
    availability: "Weekdays after 4 PM",
    online: true
  },
  { 
    id: 2, 
    name: "Maya Wijaya", 
    studentId: "2024D5962", 
    course: "CMPT 225", 
    major: "DCBM", 
    batch: "2024", 
    avatar: "", 
    bio: "Interested in web development and UX design. Currently working on a portfolio website project.",
    interests: ["Web Development", "UI/UX Design", "JavaScript"],
    availability: "Tuesdays and Thursdays",
    online: false
  },
  { 
    id: 3, 
    name: "Budi Santoso", 
    studentId: "2024D5899", 
    course: "MATH 151", 
    major: "DC", 
    batch: "2024", 
    avatar: "", 
    bio: "Math enthusiast focusing on calculus and statistics. Would love to join a study group.",
    interests: ["Calculus", "Statistics", "Problem Solving"],
    availability: "Weekends and Wednesday evenings",
    online: true
  },
  { 
    id: 4, 
    name: "Dewi Sari", 
    studentId: "2024D5965", 
    course: "BUS 272", 
    major: "BM", 
    batch: "2024", 
    avatar: "", 
    bio: "Studying business with a focus on international marketing. Looking for case study partners.",
    interests: ["Marketing", "Business Strategy", "Global Markets"],
    availability: "Monday, Wednesday, Friday afternoons",
    online: false
  },
  { 
    id: 5, 
    name: "Reza Gunawan", 
    studentId: "2024D5978", 
    course: "PHYS 101", 
    major: "DC", 
    batch: "2024", 
    avatar: "", 
    bio: "First-year physics student interested in theoretical physics. Seeking study partners for weekly sessions.",
    interests: ["Physics", "Mathematics", "Research"],
    availability: "Evenings and weekends",
    online: true
  },
];

// Study sessions data
export const upcomingSessions = [
  { 
    id: 1, 
    subject: "Algorithms Study Group", 
    date: "Today, 3:00 PM", 
    location: "AQ 3005", 
    participants: 5,
    type: "offline" as const,
    hostId: "2024D5963"
  },
  { 
    id: 2, 
    subject: "Calculus Review", 
    date: "Tomorrow, 11:00 AM", 
    location: "Library Room 2", 
    participants: 3,
    type: "offline" as const,
    hostId: "2024D5899"
  },
  { 
    id: 3, 
    subject: "Physics Lab Prep", 
    date: "Oct 20, 4:30 PM", 
    location: "SSC 7172", 
    participants: 4,
    type: "offline" as const,
    hostId: "2024D5978"
  },
  { 
    id: 4, 
    subject: "Web Development Workshop", 
    date: "Oct 21, 2:00 PM", 
    location: "Online", 
    participants: 6,
    type: "online" as const,
    password: "webdev123",
    hostId: "2024D5962"
  },
];

// AI study partner matching module (mock)
export const findMatchingPartners = (userId: string, preferences: any = {}) => {
  // In a real app, this would use an actual algorithm
  // For this mock, we'll just return other students with weighted scores
  
  // Get the current user
  const currentUser = allStudentsData.find(user => user.studentId === userId);
  if (!currentUser) return [];
  
  // Get potential matches (excluding the current user)
  const potentialMatches = allStudentsData.filter(user => user.studentId !== userId);
  
  // Calculate match scores
  return potentialMatches.map(match => {
    // Base score
    let score = 50;
    
    // Same major bonus
    if (match.major === currentUser.major) score += 15;
    
    // Same course bonus
    if (match.course === currentUser.course) score += 20;
    
    // Same batch bonus
    if (match.batch === currentUser.batch) score += 10;
    
    // Interests overlap
    const sharedInterests = currentUser.interests?.filter(interest => 
      match.interests?.includes(interest)
    ) || [];
    score += sharedInterests.length * 5;
    
    return {
      ...match,
      matchScore: Math.min(score, 100), // Cap at 100%
      sharedInterests
    };
  }).sort((a, b) => b.matchScore - a.matchScore); // Sort by match score
};
