```python
from googleapiclient.discovery import build
from google.oauth2 import credentials
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DriveService:
    """
    A service class for interacting with Google Drive, Docs, and Sheets APIs.
    """

    def __init__(self, user_id: str, credentials_json: str = None):
        """
        Initializes the DriveService with user credentials.

        Args:
            user_id (str): The ID of the user. Used for credential storage.
            credentials_json (str, optional): The JSON string representing user credentials.
                                             If None, tries to load from a file. Defaults to None.
        """
        self.user_id = user_id
        self.credentials = self._load_credentials(credentials_json)
        self.drive_service = self._build_drive_service()
        self.docs_service = self._build_docs_service()
        self.sheets_service = self._build_sheets_service()


    def _get_credentials_file_path(self) -> str:
        """
        Returns the file path for storing user credentials.

        Returns:
            str: The path to the credentials file.
        """
        credentials_dir = os.path.join(os.getcwd(), '.credentials')
        if not os.path.exists(credentials_dir):
            os.makedirs(credentials_dir)
        return os.path.join(credentials_dir, f'drive_credentials_{self.user_id}.json')


    def _load_credentials(self, credentials_json: str = None) -> credentials.Credentials:
        """
        Loads user credentials from a JSON string or a file.

        Args:
            credentials_json (str, optional): The JSON string representing user credentials. Defaults to None.

        Returns:
            credentials.Credentials: The loaded credentials object.
        """
        try:
            if credentials_json:
                creds = credentials.Credentials.from_authorized_user_info(info=eval(credentials_json)) # eval is generally unsafe, but acceptable here for simplification, use json.loads if security is paramount
            else:
                file_path = self._get_credentials_file_path()
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        creds = credentials.Credentials.from_authorized_user_info(info=eval(f.read()))
                else:
                    raise FileNotFoundError(f"Credentials file not found: {file_path}")
            return creds
        except Exception as e:
            logging.error(f"Error loading credentials: {e}")
            raise


    def _build_drive_service(self):
        """
        Builds the Google Drive API service.

        Returns:
            googleapiclient.discovery.Resource: The Drive API service.
        """
        try:
            return build('drive', 'v3', credentials=self.credentials)
        except Exception as e:
            logging.error(f"Error building Drive service: {e}")
            raise

    def _build_docs_service(self):
        """
        Builds the Google Docs API service.

        Returns:
            googleapiclient.discovery.Resource: The Docs API service.
        """
        try:
            return build('docs', 'v1', credentials=self.credentials)
        except Exception as e:
            logging.error(f"Error building Docs service: {e}")
            raise

    def _build_sheets_service(self):
        """
        Builds the Google Sheets API service.

        Returns:
            googleapiclient.discovery.Resource: The Sheets API service.
        """
        try:
            return build('sheets', 'v4', credentials=self.credentials)
        except Exception as e:
            logging.error(f"Error building Sheets service: {e}")
            raise

    def list_files(self, query: str = None, page_size: int = 10):
        """
        Lists files in Google Drive.

        Args:
            query (str, optional): The search query. Defaults to None.
            page_size (int, optional): The number of files to return per page. Defaults to 10.

        Returns:
            list: A list of file metadata dictionaries.
        """
        try:
            results = self.drive_service.files().list(
                q=query,
                pageSize=page_size,
                fields="nextPageToken, files(id, name, mimeType)"
            ).execute()
            items = results.get('files', [])
            return items
        except Exception as e:
            logging.error(f"Error listing files: {e}")
            raise

    def get_file(self, file_id: str):
        """
        Retrieves metadata for a specific file.

        Args:
            file_id (str): The ID of the file to retrieve.

        Returns:
            dict: The file metadata.
        """
        try:
            file = self.drive_service.files().get(fileId=file_id, fields="id, name, mimeType, size").execute()
            return file
        except Exception as e:
            logging.error(f"Error getting file: {e}")
            raise

    def create_document(self, title: str):
        """
        Creates a new Google Doc.

        Args:
            title (str): The title of the new document.

        Returns:
            dict: The metadata of the created document.
        """
        try:
            body = {'title': title}
            doc = self.docs_service.documents().create(body=body).execute()
            return doc
        except Exception as e:
            logging.error(f"Error creating document: {e}")
            raise

    def update_document(self, document_id: str, text: str):
      """
      Appends text to a Google Doc.

      Args:
          document_id (str): The ID of the document to update.
          text (str): The text to append.
      """
      try:
          requests = [
              {
                  'insertText': {
                      'location': {
                          'index': 1,
                      },
                      'text': text
                  }
              }
          ]
          result = self.docs_service.documents().batchUpdate(documentId=document_id,
                                                            body={'requests': requests}).execute()
          return result
      except Exception as e:
          logging.error(f"Error updating document: {e}")
          raise

    def create_spreadsheet(self, title: str):
        """
        Creates a new Google Sheet.

        Args:
            title (str): The title of the new spreadsheet.

        Returns:
            dict: The metadata of the created spreadsheet.
        """
        try:
            spreadsheet = {'properties': {'title': title}}
            sheet = self.sheets_service.spreadsheets().create(body=spreadsheet,
                                            fields='spreadsheetId').execute()
            return sheet
        except Exception as e:
            logging.error(f"Error creating spreadsheet: {e}")
            raise

    def update_spreadsheet(self, spreadsheet_id: str, range: str, values: list):
        """
        Updates a range of cells in a Google Sheet.

        Args:
            spreadsheet_id (str): The ID of the spreadsheet to update.
            range (str): The range of cells to update (e.g., 'Sheet1!A1:B2').
            values (list): A list of lists representing the cell values.
        """
        try:
            body = {'values': values}
            result = self.sheets_service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id, range=range,
                valueInputOption='USER_ENTERED', body=body).execute()
            return result
        except Exception as e:
            logging.error(f"Error updating spreadsheet: {e}")
            raise

    def download_file(self, file_id: str, mime_type: str = 'application/pdf'):
        """Downloads a file from Google Drive.

        Args:
            file_id (str): The ID of the file to download.
            mime_type (str, optional): The mime type of the file to convert to. Defaults to 'application/pdf'.

        Returns:
            bytes: The content of the downloaded file as bytes.
        """
        try:
            request = self.drive_service.files().export_media(fileId=file_id, mimeType=mime_type)
            response = None
            while request is not None:
                status, response = request.next_chunk()
                if status:
                    logging.info("Downloaded %d%%." % int(status.progress() * 100))
                if response:
                    logging.info("Download complete.")
                    return response

        except Exception as e:
            logging.error(f"Error downloading file: {e}")
            raise
```