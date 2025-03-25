
import React, { useRef, useEffect } from 'react';

interface ReactionPickerProps {
  onReact: (reaction: string) => void;
  onClose: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onReact, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  const reactions = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'angry', emoji: '😡', label: 'Angry' },
    { type: 'smile', emoji: '🙂', label: 'Smile' }
  ];

  // Close the reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={ref}
      className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg px-3 py-2 flex items-center space-x-3 z-10"
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.type}
          className="hover:scale-125 transition-transform px-1 py-1 rounded-full"
          onClick={() => onReact(reaction.type)}
          title={reaction.label}
        >
          <span className="text-xl">{reaction.emoji}</span>
        </button>
      ))}
    </div>
  );
};
