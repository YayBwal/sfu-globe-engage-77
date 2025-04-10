
import { supabase } from "@/integrations/supabase/client";

// Generic notification creation function
export const createNotification = async (
  userId: string, 
  title: string, 
  message: string,
  source: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        source,
        type,
        is_read: false
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// Friend request notification
export const notifyFriendRequest = async (userId: string, requesterName: string) => {
  return createNotification(
    userId,
    'New Friend Request',
    `${requesterName} has sent you a friend request.`,
    'friend',
    'info'
  );
};

// Friend request accepted notification
export const notifyFriendRequestAccepted = async (userId: string, accepterName: string) => {
  return createNotification(
    userId,
    'Friend Request Accepted',
    `${accepterName} has accepted your friend request.`,
    'friend',
    'success'
  );
};

// Study session notification
export const notifyNewStudySession = async (userIds: string[], hostName: string, subject: string) => {
  const promises = userIds.map(userId => 
    createNotification(
      userId,
      'New Study Session',
      `${hostName} has created a new study session for ${subject}.`,
      'study',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Study session update notification
export const notifyStudySessionUpdate = async (userIds: string[], hostName: string, subject: string, update: string) => {
  const promises = userIds.map(userId => 
    createNotification(
      userId,
      'Study Session Update',
      `${hostName} has updated the ${subject} study session: ${update}`,
      'study',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Study session reminder notification
export const notifyStudySessionReminder = async (userIds: string[], subject: string, dateTime: string) => {
  const promises = userIds.map(userId => 
    createNotification(
      userId,
      'Study Session Reminder',
      `Your study session for ${subject} is scheduled to start at ${dateTime}.`,
      'study',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Quiz notification
export const notifyQuizUpdate = async (userIds: string[], quizTitle: string) => {
  const promises = userIds.map(userId => 
    createNotification(
      userId,
      'Quiz Update',
      `The quiz "${quizTitle}" has been updated.`,
      'study',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Quiz results notification
export const notifyQuizResults = async (userId: string, quizTitle: string, score: number, totalQuestions: number) => {
  return createNotification(
    userId,
    'Quiz Results',
    `Your results for "${quizTitle}": ${score}/${totalQuestions}`,
    'study',
    'success'
  );
};

// Club event notification
export const notifyClubEvent = async (memberIds: string[], clubName: string, eventTitle: string) => {
  const promises = memberIds.map(userId => 
    createNotification(
      userId,
      'Club Event',
      `${clubName} has posted a new event: ${eventTitle}`,
      'clubs',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Club membership notification
export const notifyClubMembership = async (userId: string, clubName: string, status: 'approved' | 'rejected') => {
  const title = status === 'approved' ? 'Club Membership Approved' : 'Club Membership Rejected';
  const message = status === 'approved' 
    ? `Your request to join ${clubName} has been approved.`
    : `Your request to join ${clubName} has been rejected.`;
  const type = status === 'approved' ? 'success' : 'error';
  
  return createNotification(
    userId,
    title,
    message,
    'clubs',
    type
  );
};

// Club activity notification
export const notifyClubActivity = async (memberIds: string[], clubName: string, activityTitle: string, activityType: string) => {
  const promises = memberIds.map(userId => 
    createNotification(
      userId,
      'Club Activity',
      `${clubName} has posted a new ${activityType}: ${activityTitle}`,
      'clubs',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Newsfeed post notification
export const notifyNewsfeedUpdate = async (followerIds: string[], posterName: string, postTitle: string) => {
  const promises = followerIds.map(userId => 
    createNotification(
      userId,
      'New Post',
      `${posterName} has posted: ${postTitle}`,
      'newsfeed',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Post comment notification
export const notifyPostComment = async (userId: string, commenterName: string, postTitle: string) => {
  return createNotification(
    userId,
    'New Comment',
    `${commenterName} commented on your post: ${postTitle}`,
    'newsfeed',
    'info'
  );
};

// Post reaction notification
export const notifyPostReaction = async (userId: string, reactorName: string, postTitle: string, reactionType: string) => {
  return createNotification(
    userId,
    'New Reaction',
    `${reactorName} reacted with ${reactionType} to your post: ${postTitle}`,
    'newsfeed',
    'info'
  );
};

// Marketplace notification
export const notifyMarketplaceActivity = async (userIds: string[], itemTitle: string, action: string, reason?: string) => {
  const titles: { [key: string]: string } = {
    'approved': 'Item Approved',
    'declined': 'Item Declined',
    'purchased': 'Item Purchased',
    'sold': 'Item Sold'
  };

  const messages: { [key: string]: (reason?: string) => string } = {
    'approved': () => `Your item "${itemTitle}" has been approved and is now visible in the marketplace.`,
    'declined': (reason) => reason && reason.trim() 
      ? `Your item "${itemTitle}" was declined: ${reason.trim()}`
      : `Your item "${itemTitle}" was declined by an administrator.`,
    'purchased': () => `You have successfully purchased "${itemTitle}".`,
    'sold': () => `Your item "${itemTitle}" has been sold.`
  };
  
  const types: { [key: string]: 'info' | 'success' | 'warning' | 'error' } = {
    'approved': 'success',
    'declined': 'error',
    'purchased': 'success',
    'sold': 'success'
  };

  const promises = userIds.map(userId => 
    createNotification(
      userId,
      titles[action] || 'Marketplace Update',
      messages[action] ? messages[action](reason) : `The item "${itemTitle}" has been ${action}.`,
      'marketplace',
      types[action] || 'info'
    )
  );
  
  return Promise.all(promises);
};

// Marketplace interest notification
export const notifyMarketplaceInterest = async (sellerId: string, buyerName: string, itemTitle: string) => {
  return createNotification(
    sellerId,
    'Item Interest',
    `${buyerName} is interested in your item: ${itemTitle}`,
    'marketplace',
    'info'
  );
};

// Marketplace price update notification
export const notifyMarketplacePriceUpdate = async (interestedUserIds: string[], sellerName: string, itemTitle: string, newPrice: string) => {
  const promises = interestedUserIds.map(userId => 
    createNotification(
      userId,
      'Price Update',
      `${sellerName} updated the price of ${itemTitle} to ${newPrice}.`,
      'marketplace',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Message notification
export const notifyNewMessage = async (userId: string, senderName: string) => {
  return createNotification(
    userId,
    'New Message',
    `You have received a new message from ${senderName}.`,
    'friend',
    'info'
  );
};

// Class attendance notification
export const notifyAttendanceSession = async (studentIds: string[], className: string, sessionTime: string) => {
  const promises = studentIds.map(userId => 
    createNotification(
      userId,
      'Attendance Session Open',
      `Attendance for ${className} is now open for the session at ${sessionTime}.`,
      'attendance',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// System notification
export const notifySystemUpdate = async (userIds: string[], title: string, message: string) => {
  const promises = userIds.map(userId => 
    createNotification(
      userId,
      title,
      message,
      'system',
      'info'
    )
  );
  
  return Promise.all(promises);
};

// Deadline reminder notification
export const notifyDeadlineReminder = async (userId: string, title: string, deadline: string, itemType: string) => {
  return createNotification(
    userId,
    'Deadline Reminder',
    `Reminder: The ${itemType} "${title}" is due on ${deadline}.`,
    'study',
    'warning'
  );
};
