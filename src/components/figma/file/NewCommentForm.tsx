import React, { useState } from 'react';

interface NewCommentFormProps {
    fileKey: string;
    parentCommentId?: string;
    onCommentSubmit: (message: string) => void;
    onCancel: () => void;
}

const NewCommentForm: React.FC<NewCommentFormProps> = ({ fileKey, parentCommentId, onCommentSubmit, onCancel }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onCommentSubmit(message);
            setMessage(''); // Clear the input after submitting
        }
    };

    return (
        <form onSubmit={handleSubmit} className="new-comment-form">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={parentCommentId ? "Reply to comment..." : "Add a comment..."}
                className="comment-input"
            />
            <div className="form-actions">
                <button type="submit" className="submit-button" disabled={!message.trim()}>
                    Post
                </button>
                <button type="button" className="cancel-button" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default NewCommentForm;