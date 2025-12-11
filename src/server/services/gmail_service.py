```python
from googleapiclient.discovery import build
from google.oauth2 import credentials

class GmailService:
    def __init__(self, user_id, credentials_json):
        """
        Initializes the GmailService with user credentials.

        Args:
            user_id (str): The user's unique identifier.
            credentials_json (str): JSON string containing the user's OAuth 2.0 credentials.
        """
        self.user_id = user_id
        self.credentials = credentials.Credentials.from_authorized_user_info(info=credentials_json)
        self.service = build('gmail', 'v1', credentials=self.credentials)

    def get_user_profile(self):
        """
        Fetches the user's Gmail profile information.

        Returns:
            dict: A dictionary containing the user's profile information, or None if an error occurs.
        """
        try:
            profile = self.service.users().getProfile(userId='me').execute()
            return profile
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def list_emails(self, query=None, max_results=10):
        """
        Lists emails in the user's inbox based on a query.

        Args:
            query (str, optional): The search query for filtering emails. Defaults to None.
            max_results (int, optional): The maximum number of emails to return. Defaults to 10.

        Returns:
            list: A list of email IDs, or None if an error occurs.
        """
        try:
            results = self.service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
            messages = results.get('messages', [])

            if not messages:
                print('No messages found.')
                return []
            else:
                return messages
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def get_email(self, message_id):
        """
        Retrieves a specific email by its ID.

        Args:
            message_id (str): The ID of the email to retrieve.

        Returns:
            dict: A dictionary containing the email's details, or None if an error occurs.
        """
        try:
            message = self.service.users().messages().get(userId='me', id=message_id, format='full').execute()
            return message
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def send_email(self, to, subject, message_text):
          """
          Sends an email from the user's Gmail account.

          Args:
              to (str): Recipient email address.
              subject (str): Email subject.
              message_text (str): Email body.

          Returns:
              dict: The sent message object, or None on error.
          """
          import base64
          from email.mime.text import MIMEText

          try:
              message = MIMEText(message_text)
              message['to'] = to
              message['subject'] = subject
              raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
              send_message = (self.service.users().messages().send(userId="me", body={'raw': raw}).execute())
              return send_message
          except Exception as e:
              print(f"An error occurred: {e}")
              return None
```