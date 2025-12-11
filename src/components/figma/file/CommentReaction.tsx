```tsx
import React, { useState } from 'react';

interface Props {
  commentId: string;
  reactions: any[]; // Replace 'any' with a more specific type if available
  onAddReaction: (emoji: string) => void;
  onDeleteReaction: (emoji: string) => void;
}

const CommentReaction: React.FC<Props> = ({
  commentId,
  reactions,
  onAddReaction,
  onDeleteReaction,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleAddReaction = (emoji: string) => {
    onAddReaction(emoji);
    setShowEmojiPicker(false);
  };

  const handleDeleteReaction = (emoji: string) => {
    onDeleteReaction(emoji);
  };

  return (
    <div>
      {reactions.map((reaction, index) => (
        <span key={index}>
          {reaction.emoji}
          <button onClick={() => handleDeleteReaction(reaction.emoji)}>
            Delete
          </button>
        </span>
      ))}

      <button onClick={() => setShowEmojiPicker(true)}>Add Reaction</button>

      {showEmojiPicker && (
        <div>
          {/* Replace with your actual Emoji Picker Component */}
          <p>Emoji Picker Here</p>
          <button onClick={() => handleAddReaction(':heart:')}>❤️</button>
          <button onClick={() => handleAddReaction(':thumbsup:')}>👍</button>
          {/* ... other emojis ... */}
          <button onClick={() => setShowEmojiPicker(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default CommentReaction;
```