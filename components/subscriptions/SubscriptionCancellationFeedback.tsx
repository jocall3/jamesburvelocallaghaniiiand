import React, { useState, ChangeEvent, FormEvent } from 'react';

interface SubscriptionCancellationFeedbackProps {
  onFeedbackSubmit: (feedback: string) => void;
  onCancel: () => void;
}

const SubscriptionCancellationFeedback: React.FC<SubscriptionCancellationFeedbackProps> = ({
  onFeedbackSubmit,
  onCancel,
}) => {
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFeedbackChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(event.target.value);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (feedback.trim()) {
      setIsSubmitting(true);
      // In a real application, you would send this feedback to your backend
      // For now, we'll simulate a delay and then call the submit handler
      setTimeout(() => {
        onFeedbackSubmit(feedback);
        setIsSubmitting(false);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">We're sorry to see you go!</h2>
        <p className="text-gray-600 mb-6">
          Could you please tell us why you're cancelling your subscription? Your feedback helps us improve.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="cancellation-feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback:
            </label>
            <textarea
              id="cancellation-feedback"
              rows={4}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
              placeholder="e.g., The price is too high, I don't use it enough, etc."
              value={feedback}
              onChange={handleFeedbackChange}
              required
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              No, I want to cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              disabled={isSubmitting || !feedback.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionCancellationFeedback;