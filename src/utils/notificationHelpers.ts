
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

// Marketplace notification
export const notifyMarketplaceActivity = async (userIds: string[], itemTitle: string, action: string) => {
  const promises = userIds.map(userId => 
    createNotification(
      userId,
      'Marketplace Update',
      `The item "${itemTitle}" has been ${action}.`,
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
