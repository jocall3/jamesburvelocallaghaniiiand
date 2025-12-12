import React from 'react';
import { Comment } from '../../../types/figma';

interface CommentThreadProps {
  comment: Comment;
}

const CommentThread: React.FC<CommentThreadProps> = ({ comment }) => {
  return (
    <div className="comment-thread">
      <div className="comment">
        <div className="comment-header">
          <img src={comment.user.img_url} alt={comment.user.handle} className="comment-avatar" />
          <span className="comment-author">{comment.user.handle}</span>
          <span className="comment-date">{comment.created_at}</span>
        </div>
        <div className="comment-body">
          {comment.message}
        </div>
      </div>
      {/* Add logic to display replies here if needed. The openAPI spec does not seem to provide a way to fetch replies to a specific comment, so it would likely need to be implemented by fetching all comments, and filtering the replies by parent_id. For now, this component just displays the main comment in the thread. */}
    </div>
  );
};

export default CommentThread;