
import React from 'react';
import { PostItem, Post } from './PostItem';

interface PostsFeedProps {
  posts: Post[];
  isLoading: boolean;
  activeFilter: string;
  onPostDeleted: () => void;
}

export const PostsFeed: React.FC<PostsFeedProps> = ({ 
  posts, 
  isLoading, 
  activeFilter, 
  onPostDeleted 
}) => {
  const filteredPosts = React.useMemo(() => {
    if (activeFilter === "all") {
      return posts;
    } else if (activeFilter === "media") {
      return posts.filter(post => post.media_type && post.media_type !== 'none');
    } else if (activeFilter === "text") {
      return posts.filter(post => !post.media_url || post.media_type === 'none');
    }
    return posts;
  }, [posts, activeFilter]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading posts...</p>
        </div>
      ) : filteredPosts.length > 0 ? (
        filteredPosts.map(post => (
          <PostItem 
            key={post.id} 
            post={post} 
            onPostDeleted={onPostDeleted}
          />
        ))
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 mb-3">No posts to display</p>
          <p className="text-sm text-gray-400">
            {activeFilter === "all" 
              ? "Be the first to create a post!" 
              : "Try a different filter or create a new post."}
          </p>
        </div>
      )}
    </div>
  );
};
