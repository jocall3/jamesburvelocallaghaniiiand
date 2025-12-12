import React from 'react';

interface Event {
  date: string;
  description: string;
  type: 'news' | 'economic' | 'rating' | 'other';
  impact?: 'positive' | 'negative' | 'neutral';
  details?: any; // Allow for arbitrary details
}

interface EventTimelineProps {
  events: Event[];
}

const EventTimeline: React.FC<EventTimelineProps> = ({ events }) => {
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <div className="event-timeline">
      <h2>Event Timeline</h2>
      <div className="timeline">
        {sortedEvents.map((event, index) => (
          <div key={index} className="event-item">
            <div className="event-date">{event.date}</div>
            <div className={`event-content ${event.impact === 'positive' ? 'positive' : event.impact === 'negative' ? 'negative' : ''}`}>
              <div className="event-type">{event.type}</div>
              <p>{event.description}</p>
              {event.details && (
                <div className="event-details">
                  {/* Render details as needed.  This is a placeholder and should be customized */}
                  {Object.entries(event.details).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .event-timeline {
          width: 100%;
          padding: 20px;
          box-sizing: border-box;
        }

        .timeline {
          position: relative;
          padding-left: 30px; /* Space for date */
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #ddd;
        }

        .event-item {
          margin-bottom: 20px;
          position: relative;
        }

        .event-date {
          position: absolute;
          left: -100px;
          width: 90px;
          text-align: right;
          color: #888;
        }

        .event-content {
          background-color: #f9f9f9;
          border: 1px solid #ccc;
          padding: 10px;
          border-radius: 5px;
          margin-left: 20px; /* Space from vertical line */
        }

        .event-type {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .positive {
          background-color: #e8f5e9;
          border-color: #4caf50;
        }

        .negative {
          background-color: #ffebee;
          border-color: #f44336;
        }

        .event-details {
          margin-top: 10px;
          font-size: 0.9em;
          color: #666;
        }

      `}</style>
    </div>
  );
};

export default EventTimeline;