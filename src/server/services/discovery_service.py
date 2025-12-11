```python
import httplib2
import json
from apiclient.discovery import build
from apiclient.errors import HttpError

class DiscoveryService:
    """
    A service for interacting with the Google API Discovery Service.
    """

    def __init__(self):
        """
        Initializes the DiscoveryService.
        """
        self.http = httplib2.Http()
        self.discovery_url = 'https://www.googleapis.com/discovery/v1/apis'

    def list_apis(self):
        """
        Lists all available APIs from the Discovery Service.

        Returns:
            A list of API dictionaries, or None if an error occurs.
        """
        try:
            resp, content = self.http.request(self.discovery_url)
            if resp.status == 200:
                data = json.loads(content.decode('utf-8'))
                return data.get('items', [])
            else:
                print(f"Error listing APIs: {resp.status} - {content.decode('utf-8')}")
                return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def get_api_metadata(self, api_name, api_version):
        """
        Retrieves metadata for a specific API.

        Args:
            api_name: The name of the API (e.g., "drive").
            api_version: The version of the API (e.g., "v3").

        Returns:
            A dictionary containing the API metadata, or None if not found or an error occurs.
        """
        try:
            discovery_doc_url = f'https://www.googleapis.com/discovery/v1/apis/{api_name}/{api_version}/rest'
            resp, content = self.http.request(discovery_doc_url)
            if resp.status == 200:
                return json.loads(content.decode('utf-8'))
            elif resp.status == 404:
                print(f"API {api_name}/{api_version} not found.")
                return None
            else:
                print(f"Error fetching metadata for {api_name}/{api_version}: {resp.status} - {content.decode('utf-8')}")
                return None

        except Exception as e:
            print(f"An error occurred while fetching metadata for {api_name}/{api_version}: {e}")
            return None

    def get_api_client(self, api_name, api_version, http_auth=None):
        """
        Builds and returns an API client for the specified API.

        Args:
            api_name: The name of the API (e.g., "drive").
            api_version: The version of the API (e.g., "v3").
            http_auth: An optional httplib2.Http instance with authentication.  If None, uses the default.

        Returns:
            An API client object, or None if an error occurs.
        """
        try:
            if http_auth:
                service = build(api_name, api_version, http=http_auth)
            else:
                service = build(api_name, api_version)
            return service
        except HttpError as e:
            print(f"HTTP error building client for {api_name}/{api_version}: {e}")
            return None
        except Exception as e:
            print(f"Error building client for {api_name}/{api_version}: {e}")
            return None
```