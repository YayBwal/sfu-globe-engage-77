
import { supabase } from "@/integrations/supabase/client";

// Generic notification creation function
export const createNotification = async (
  userId: string, 
  title: string, 
  message: string, 
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
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
      'info'
    )
  );
  
  return Promise.all(promises);
};
