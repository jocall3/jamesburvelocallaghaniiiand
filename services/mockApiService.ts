interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  integrations: string[]; // e.g., 'google', 'microsoft', 'apple', 'amazon', 'meta'
}

interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  location?: string;
  description?: string;
  organizer: {
    email: string;
    displayName: string;
  };
}

interface MicrosoftOutlookEmail {
  id: string;
  subject: string;
  bodyPreview: string;
  sender: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string; // ISO date string
  isRead: boolean;
}

interface AppleReminder {
  id: string;
  title: string;
  dueDate?: string; // ISO date string
  isCompleted: boolean;
  notes?: string;
}

interface AmazonProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  description: string;
  rating: number;
}

interface MetaPost {
  id: string;
  author: {
    id: string;
    name: string;
    profilePictureUrl: string;
  };
  content: string;
  timestamp: string; // ISO date string
  likes: number;
  comments: number;
}

/**
 * A centralized service for providing mock data responses for various API calls,
 * useful during development and for simulating integrations.
 */
class MockApiService {
  private static readonly MOCK_DELAY_MS = 500; // Simulate network latency

  /**
   * Simulates fetching a generic user profile.
   * @param userId The ID of the user.
   * @returns A promise that resolves with a mock UserProfile.
   */
  static getUserProfile(userId: string): Promise<UserProfile> {
    console.log(`Mock: Fetching user profile for ${userId}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockProfile: UserProfile = {
          id: userId,
          name: 'John Doe',
          email: `${userId}@example.com`,
          avatarUrl: 'https://i.pravatar.cc/150?img=68',
          integrations: ['google', 'microsoft', 'apple', 'amazon', 'meta'],
        };
        resolve(mockProfile);
      }, MockApiService.MOCK_DELAY_MS);
    });
  }

  /**
   * Simulates fetching Google Calendar events.
   * @param userId The ID of the user.
   * @param startDate Optional start date for filtering events (ISO string).
   * @param endDate Optional end date for filtering events (ISO string).
   * @returns A promise that resolves with an array of mock GoogleCalendarEvent.
   */
  static getGoogleCalendarEvents(userId: string, startDate?: string, endDate?: string): Promise<GoogleCalendarEvent[]> {
    console.log(`Mock: Fetching Google Calendar events for ${userId} from ${startDate || 'start'} to ${endDate || 'end'}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const events: GoogleCalendarEvent[] = [
          {
            id: 'gcal-1',
            title: 'Team Standup',
            start: '2023-10-26T09:00:00Z',
            end: '2023-10-26T09:30:00Z',
            location: 'Virtual Meeting (Google Meet)',
            description: 'Daily team synchronization.',
            organizer: { email: 'manager@example.com', displayName: 'Jane Manager' },
          },
          {
            id: 'gcal-2',
            title: 'Project Review',
            start: '2023-10-26T14:00:00Z',
            end: '2023-10-26T15:00:00Z',
            location: 'Conference Room A',
            description: 'Review Q4 project milestones.',
            organizer: { email: 'john.doe@example.com', displayName: 'John Doe' },
          },
          {
            id: 'gcal-3',
            title: 'Lunch with Sarah',
            start: '2023-10-27T12:30:00Z',
            end: '2023-10-27T13:30:00Z',
            organizer: { email: 'sarah@example.com', displayName: 'Sarah Connor' },
          },
        ];
        // Basic filtering for demonstration
        let filteredEvents = events;
        if (startDate) {
          filteredEvents = filteredEvents.filter(event => event.end >= startDate);
        }
        if (endDate) {
          filteredEvents = filteredEvents.filter(event => event.start <= endDate);
        }
        resolve(filteredEvents);
      }, MockApiService.MOCK_DELAY_MS);
    });
  }

  /**
   * Simulates fetching Microsoft Outlook emails.
   * @param userId The ID of the user.
   * @param folder The email folder to fetch from (e.g., 'Inbox', 'SentItems').
   * @param top The maximum number of emails to return.
   * @returns A promise that resolves with an array of mock MicrosoftOutlookEmail.
   */
  static getMicrosoftOutlookEmails(userId: string, folder: string = 'Inbox', top: number = 10): Promise<MicrosoftOutlookEmail[]> {
    console.log(`Mock: Fetching Microsoft Outlook emails for ${userId} from folder '${folder}' (top ${top})`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const emails: MicrosoftOutlookEmail[] = [
          {
            id: 'outlook-1',
            subject: 'Important: Project Deadline Approaching',
            bodyPreview: 'Hi team, just a reminder that the project deadline is next Friday...',
            sender: { emailAddress: { address: 'project.lead@example.com', name: 'Project Lead' } },
            receivedDateTime: '2023-10-25T10:00:00Z',
            isRead: false,
          },
          {
            id: 'outlook-2',
            subject: 'Weekly Report - Q3 Performance',
            bodyPreview: 'Please find attached the weekly performance report for Q3...',
            sender: { emailAddress: { address: 'reporting@example.com', name: 'Reporting Team' } },
            receivedDateTime: '2023-10-24T15:30:00Z',
            isRead: true,
          },
          {
            id: 'outlook-3',
            subject: 'Your Order Confirmation #12345',
            bodyPreview: 'Thank you for your recent purchase. Your order #12345 has been confirmed...',
            sender: { emailAddress: { address: 'no-reply@shop.com', name: 'Shop.com' } },
            receivedDateTime: '2023-10-23T08:15:00Z',
            isRead: true,
          },
          {
            id: 'outlook-4',
            subject: 'Meeting Minutes - October 23rd',
            bodyPreview: 'Attached are the minutes from our meeting on October 23rd...',
            sender: { emailAddress: { address: 'admin@example.com', name: 'Admin Assistant' } },
            receivedDateTime: '2023-10-23T11:00:00Z',
            isRead: false,
          },
        ];
        // In a real scenario, folder would filter, here we just return a subset.
        resolve(emails.slice(0, top));
      }, MockApiService.MOCK_DELAY_MS);
    });
  }

  /**
   * Simulates fetching Apple Reminders.
   * @param userId The ID of the user.
   * @param includeCompleted Whether to include completed reminders.
   * @returns A promise that resolves with an array of mock AppleReminder.
   */
  static getAppleReminders(userId: string, includeCompleted: boolean = false): Promise<AppleReminder[]> {
    console.log(`Mock: Fetching Apple Reminders for ${userId} (includeCompleted: ${includeCompleted})`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const reminders: AppleReminder[] = [
          {
            id: 'apple-rem-1',
            title: 'Buy groceries',
            dueDate: '2023-10-26T18:00:00Z',
            isCompleted: false,
            notes: 'Milk, eggs, bread, apples',
          },
          {
            id: 'apple-rem-2',
            title: 'Call Mom',
            dueDate: '2023-10-27T10:00:00Z',
            isCompleted: false,
          },
          {
            id: 'apple-rem-3',
            title: 'Finish report draft',
            dueDate: '2023-10-25T17:00:00Z',
            isCompleted: true,
            notes: 'Send to Jane for review.',
          },
          {
            id: 'apple-rem-4',
            title: 'Pay utility bill',
            dueDate: '2023-10-28T00:00:00Z',
            isCompleted: false,
          },
        ];
        resolve(includeCompleted ? reminders : reminders.filter(r => !r.isCompleted));
      }, MockApiService.MOCK_DELAY_MS);
    });
  }

  /**
   * Simulates fetching Amazon products.
   * @param userId The ID of the user.
   * @param category Optional category to filter products.
   * @param query Optional search query for products.
   * @returns A promise that resolves with an array of mock AmazonProduct.
   */
  static getAmazonProducts(userId: string, category?: string, query?: string): Promise<AmazonProduct[]> {
    console.log(`Mock: Fetching Amazon products for ${userId} (category: ${category || 'all'}, query: ${query || 'none'})`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const products: AmazonProduct[] = [
          {
            id: 'amz-prod-1',
            name: 'Echo Dot (5th Gen)',
            price: 49.99,
            currency: 'USD',
            imageUrl: 'https://m.media-amazon.com/images/I/61+R3+JbQSL._AC_SL1000_.jpg',
            description: 'Our best-sounding Echo Dot yet.',
            rating: 4.5,
          },
          {
            id: 'amz-prod-2',
            name: 'Kindle Paperwhite',
            price: 139.99,
            currency: 'USD',
            imageUrl: 'https://m.media-amazon.com/images/I/61GR+y+y+yL._AC_SL1500_.jpg',
            description: 'Now with a larger display and adjustable warm light.',
            rating: 4.7,
          },
          {
            id: 'amz-prod-3',
            name: 'Fire TV Stick 4K Max',
            price: 54.99,
            currency: 'USD',
            imageUrl: 'https://m.media-amazon.com/images/I/51+R3+JbQSL._AC_SL1000_.jpg',
            description: 'Our most powerful streaming stick.',
            rating: 4.6,
          },
          {
            id: 'amz-prod-4',
            name: 'Amazon Basics Microfiber Sheet Set',
            price: 24.99,
            currency: 'USD',
            imageUrl: 'https://m.media-amazon.com/images/I/71+R3+JbQSL._AC_SL1500_.jpg',
            description: 'Soft, easy-care, wrinkle-resistant sheets.',
            rating: 4.3,
          },
        ];
        let filteredProducts = products;
        if (category) {
          // Simple category matching for mock data
          filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(category.toLowerCase()));
        }
        if (query) {
          filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
          );
        }
        resolve(filteredProducts);
      }, MockApiService.MOCK_DELAY_MS);
    });
  }

  /**
   * Simulates fetching Meta (e.g., Facebook/Instagram) feed posts.
   * @param userId The ID of the user.
   * @param limit The maximum number of posts to return.
   * @returns A promise that resolves with an array of mock MetaPost.
   */
  static getMetaFeedPosts(userId: string, limit: number = 5): Promise<MetaPost[]> {
    console.log(`Mock: Fetching Meta feed posts for ${userId} (limit: ${limit})`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const posts: MetaPost[] = [
          {
            id: 'meta-post-1',
            author: { id: 'user-a', name: 'Alice Wonderland', profilePictureUrl: 'https://i.pravatar.cc/50?img=1' },
            content: 'Had a wonderful time exploring the new hiking trail today! 🌳 #nature #hiking',
            timestamp: '2023-10-26T11:00:00Z',
            likes: 120,
            comments: 15,
          },
          {
            id: 'meta-post-2',
            author: { id: 'user-b', name: 'Bob The Builder', profilePictureUrl: 'https://i.pravatar.cc/50?img=2' },
            content: 'Just finished building my latest project! So proud of how it turned out. #DIY #woodworking',
            timestamp: '2023-10-25T16:30:00Z',
            likes: 85,
            comments: 8,
          },
          {
            id: 'meta-post-3',
            author: { id: 'user-c', name: 'Charlie Chaplin', profilePictureUrl: 'https://i.pravatar.cc/50?img=3' },
            content: 'Enjoying a quiet evening with a good book and a cup of tea. ☕📖 #relax #reading',
            timestamp: '2023-10-25T20:00:00Z',
            likes: 200,
            comments: 25,
          },
          {
            id: 'meta-post-4',
            author: { id: 'user-a', name: 'Alice Wonderland', profilePictureUrl: 'https://i.pravatar.cc/50?img=1' },
            content: 'Throwback to last summer\'s beach vacation! Can\'t wait for the next one. ☀️🏖️',
            timestamp: '2023-10-24T09:00:00Z',
            likes: 90,
            comments: 10,
          },
          {
            id: 'meta-post-5',
            author: { id: 'user-d', name: 'Diana Prince', profilePictureUrl: 'https://i.pravatar.cc/50?img=4' },
            content: 'New recipe alert! Tried making homemade pasta today and it was delicious. 🍝 #cooking #foodie',
            timestamp: '2023-10-23T18:45:00Z',
            likes: 150,
            comments: 20,
          },
        ];
        resolve(posts.slice(0, limit));
      }, MockApiService.MOCK_DELAY_MS);
    });
  }

  /**
   * Utility method to simulate an API error.
   * @param errorMessage The error message to reject with.
   * @param delayMs The delay before rejecting the promise.
   * @returns A promise that always rejects with an error.
   */
  static simulateError<T>(errorMessage: string, delayMs: number = MockApiService.MOCK_DELAY_MS): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, delayMs);
    });
  }
}

export default MockApiService;

// Export interfaces for easier consumption in other parts of the application
export type {
  UserProfile,
  GoogleCalendarEvent,
  MicrosoftOutlookEmail,
  AppleReminder,
  AmazonProduct,
  MetaPost,
};