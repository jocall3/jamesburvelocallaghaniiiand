import os
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"
YOUTUBE_ANALYTICS_API_VERSION = "v1"

class YouTubeService:
    def __init__(self):
        """Initializes the YouTubeService by getting credentials and building the service clients."""
        try:
            # Use Application Default Credentials (ADC) for authentication
            credentials, project_id = google.auth.default(
                scopes=[
                    "https://www.googleapis.com/auth/youtube",
                    "https://www.googleapis.com/auth/youtube.force-ssl",
                    "https://www.googleapis.com/auth/youtube.readonly",
                    "https://www.googleapis.com/auth/youtube.upload",
                ]
            )
            
            self.youtube = build(
                YOUTUBE_API_SERVICE_NAME, 
                YOUTUBE_API_VERSION, 
                credentials=credentials
            )
            
            self.youtube_analytics = build(
                "youtubeanalytics", 
                YOUTUBE_ANALYTICS_API_VERSION, 
                credentials=credentials
            )
            self.is_authenticated = True
            
        except google.auth.exceptions.DefaultCredentialsError as e:
            print(f"Warning: Could not find default credentials for YouTube API. Service functions might fail if API key/OAuth is not configured externally. Error: {e}")
            self.youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION)
            self.youtube_analytics = build("youtubeanalytics", YOUTUBE_ANALYTICS_API_VERSION)
            self.is_authenticated = False
        except Exception as e:
            print(f"An unexpected error occurred during YouTube service initialization: {e}")
            self.youtube = None
            self.youtube_analytics = None
            self.is_authenticated = False


    def get_channel_info(self, channel_id: str):
        """
        Fetches basic information about a YouTube channel.
        API: youtube.channels.list
        """
        if not self.youtube:
            return None

        try:
            request = self.youtube.channels().list(
                part="snippet,statistics",
                id=channel_id
            )
            response = request.execute()
            return response
        except HttpError as e:
            print(f"An HTTP error occurred while fetching channel info for {channel_id}: {e}")
            return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def search_videos(self, query: str, max_results: int = 10, order: str = 'relevance'):
        """
        Searches for videos on YouTube based on a query.
        API: youtube.search.list
        """
        if not self.youtube:
            return None
            
        try:
            request = self.youtube.search().list(
                part="snippet",
                q=query,
                maxResults=max_results,
                order=order,
                type="video"
            )
            response = request.execute()
            return response
        except HttpError as e:
            print(f"An HTTP error occurred during video search for '{query}': {e}")
            return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def get_video_details(self, video_ids: list):
        """
        Fetches detailed statistics for a list of video IDs.
        API: youtube.videos.list
        """
        if not self.youtube:
            return None
            
        if not video_ids:
            return {"items": []}

        video_id_str = ",".join(video_ids)
        
        try:
            request = self.youtube.videos().list(
                part="snippet,statistics,contentDetails,topicDetails",
                id=video_id_str
            )
            response = request.execute()
            return response
        except HttpError as e:
            print(f"An HTTP error occurred while fetching details for videos {video_ids}: {e}")
            return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def get_channel_subscriptions(self, channel_id: str, max_results: int = 50):
        """
        Fetches the list of channels the specified channel is subscribed to.
        Requires 'youtube.subscriptions.list' scope.
        API: youtube.subscriptions.list
        """
        if not self.youtube:
            return None
            
        try:
            request = self.youtube.subscriptions().list(
                part="snippet",
                channelId=channel_id,
                maxResults=max_results
            )
            response = request.execute()
            return response
        except HttpError as e:
            if e.resp.status == 403 and 'The caller does not have permission' in str(e):
                 print(f"Permission denied when fetching subscriptions for channel {channel_id}. Ensure necessary OAuth scopes are present.")
            else:
                print(f"An HTTP error occurred while fetching subscriptions for channel {channel_id}: {e}")
            return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def get_channel_uploads_playlist_id(self, channel_id: str) -> str or None:
        """
        Helper to find the 'uploads' playlist ID for a given channel.
        """
        if not self.youtube:
            return None
        try:
            request = self.youtube.channels().list(
                part="contentDetails",
                id=channel_id
            )
            response = request.execute()
            if response.get('items'):
                return response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            return None
        except HttpError as e:
            print(f"HTTP error getting uploads playlist ID for {channel_id}: {e}")
            return None
        except Exception as e:
            print(f"Error getting uploads playlist ID for {channel_id}: {e}")
            return None

    def get_playlist_items(self, playlist_id: str, max_results: int = 50) -> list:
        """
        Fetches video IDs from a specific playlist (e.g., uploads playlist).
        API: youtube.playlistItems.list
        """
        if not self.youtube:
            return []
            
        all_items = []
        next_page_token = None
        
        try:
            while True:
                request = self.youtube.playlistItems().list(
                    part="contentDetails",
                    playlistId=playlist_id,
                    maxResults=min(max_results, 50),
                    pageToken=next_page_token
                )
                response = request.execute()
                
                all_items.extend([item['contentDetails']['videoId'] for item in response.get('items', [])])
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
            
            return all_items
        except HttpError as e:
            print(f"An HTTP error occurred while fetching playlist items for {playlist_id}: {e}")
            return []
        except Exception as e:
            print(f"An error occurred: {e}")
            return []

    def get_channel_videos(self, channel_id: str, max_videos: int = 100) -> list:
        """
        Fetches a list of video IDs uploaded by a channel.
        """
        uploads_playlist_id = self.get_channel_uploads_playlist_id(channel_id)
        if not uploads_playlist_id:
            return []
        
        video_ids = self.get_playlist_items(uploads_playlist_id, max_results=max_videos)
        return video_ids

    def get_youtube_analytics_report(self, channel_id: str, metrics: str, dimensions: str, start_date: str, end_date: str):
        """
        Fetches data from the YouTube Analytics API.
        Requires appropriate OAuth scopes (e.g., youtube.readonly).
        API: youtubeAnalytics.reports.query
        """
        if not self.youtube_analytics:
            return None
            
        try:
            request = self.youtube_analytics.reports().query(
                ids=f'channel=={channel_id}',
                startDate=start_date,
                endDate=end_date,
                metrics=metrics,
                dimensions=dimensions
            )
            response = request.execute()
            return response
        except HttpError as e:
            print(f"An HTTP error occurred while fetching YouTube Analytics for channel {channel_id}: {e}")
            return None
        except Exception as e:
            print(f"An error occurred during Analytics query: {e}")
            return None
            
    def upload_video(self, title, description, tags, privacy_status, video_path):
        """
        Uploads a video to YouTube.
        Requires 'youtube.upload' scope.
        API: youtube.videos.insert
        """
        if not self.youtube:
            return None
            
        if not os.path.exists(video_path):
            print(f"Video file not found at: {video_path}")
            return None

        try:
            body = {
                'snippet': {
                    'title': title,
                    'description': description,
                    'tags': tags.split(','),
                    'categoryId': '22' # Example: 22 is 'People & Blogs' - adjust as necessary
                },
                'status': {
                    'privacyStatus': privacy_status # 'public', 'private', or 'unlisted'
                }
            }
            
            media = googleapiclient.http.MediaFileUpload(
                video_path,
                mimetype='video/mp4', # Adjust mimetype based on actual file type
                chunksize=-1,
                resumable=True
            )

            request = self.youtube.videos().insert(
                part=','.join(body.keys()),
                body=body,
                media_body=media
            )
            
            response = None
            while True:
                status, response = request.next_chunk()
                if status:
                    print(f"Upload progress: {int(status.progress() * 100)}%")
                if response:
                    break
            
            return response

        except HttpError as e:
            print(f"An HTTP error occurred during video upload: {e}")
            return None
        except Exception as e:
            print(f"An error occurred during video upload: {e}")
            return None

if __name__ == '__main__':
    # Example Usage (Requires authenticated environment setup, e.g., running via gcloud auth application-default login)
    
    # NOTE: Replace these placeholders with actual IDs/queries for testing
    TEST_CHANNEL_ID = "UC_x5XG1OV2P6uZZ5FSM9Ttw" # Example: A known channel ID
    TEST_SEARCH_QUERY = "Google Cloud Platform"
    TEST_VIDEO_IDS = ["dQw4w9WgXcQ", "g_l_e-9c3I8"] # Example videos
    
    yt_service = YouTubeService()

    if yt_service.is_authenticated:
        print("--- Fetching Channel Info ---")
        channel_data = yt_service.get_channel_info(TEST_CHANNEL_ID)
        if channel_data:
            print(f"Channel Name: {channel_data['items'][0]['snippet']['title']}")
            print(f"Subscriber Count: {channel_data['items'][0]['statistics']['subscriberCount']}")

        print("\n--- Searching Videos ---")
        search_results = yt_service.search_videos(TEST_SEARCH_QUERY, max_results=5)
        if search_results and search_results.get('items'):
            print(f"Found {len(search_results['items'])} search results.")
            
        print("\n--- Fetching Video Details ---")
        details = yt_service.get_video_details(TEST_VIDEO_IDS)
        if details and details.get('items'):
            print(f"Details fetched for {len(details['items'])} videos.")

        # Uncomment the following sections if you have the necessary credentials/scopes setup for these actions
        # print("\n--- Fetching Subscriptions (Requires appropriate scope) ---")
        # subscriptions = yt_service.get_channel_subscriptions(TEST_CHANNEL_ID)
        # if subscriptions:
        #     print(f"Found {len(subscriptions.get('items', []))} subscriptions.")

        # print("\n--- Fetching Analytics Report (Requires appropriate scope) ---")
        # # Metrics: views, averageViewDuration
        # # Dimensions: day
        # analytics = yt_service.get_youtube_analytics_report(
        #     channel_id=TEST_CHANNEL_ID,
        #     metrics="views,averageViewDuration",
        #     dimensions="day",
        #     start_date="2023-01-01",
        #     end_date="2023-01-31"
        # )
        # if analytics:
        #     print(f"Analytics report received. Column Headers: {analytics.get('columnHeaders')}")

    else:
        print("\n--- Service initialized without valid credentials. API calls requiring authentication will likely fail. ---")
        # Test unauthenticated call (Search works without user login, only API Key)
        print("\n--- Testing Unauthenticated Search ---")
        search_results = yt_service.search_videos(TEST_SEARCH_QUERY, max_results=2)
        if search_results:
            print(f"Unauthenticated search successful. Found {len(search_results.get('items', []))} items.")
        else:
            print("Unauthenticated search failed (check if API Key is set in environment variables).")
    
    print("YouTube Service Example Execution Finished.")