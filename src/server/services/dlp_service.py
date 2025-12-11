```python
from googleapiclient.discovery import build
from google.oauth2 import service_account


class DLPService:
    """
    Backend service wrapper for all interactions with the Cloud Data Loss Prevention (DLP) API.
    """

    def __init__(self, credentials_path: str = None, credentials=None):
        """
        Initializes the DLPService.

        Args:
            credentials_path (str, optional): Path to the service account key file.
                                              If None, it will try to use the credentials
                                              provided directly. Defaults to None.
            credentials (google.oauth2.credentials.Credentials, optional):  Pre-existing
                                             credentials object.  Overrides credentials_path
                                             if provided. Defaults to None.
        """
        if credentials:
            self.credentials = credentials
        elif credentials_path:
            self.credentials = service_account.Credentials.from_service_account_file(
                credentials_path
            )
        else:
            raise ValueError(
                "Must provide either a credentials_path or credentials object."
            )

        self.service = build("dlp", "v2", credentials=self.credentials)

    def inspect_text(self, project_id: str, text: str, info_types: list):
        """
        Inspects a text string for sensitive information.

        Args:
            project_id (str): The Google Cloud project ID.
            text (str): The text to inspect.
            info_types (list): A list of info type strings (e.g., ["EMAIL_ADDRESS", "PHONE_NUMBER"]).

        Returns:
            dict: The API response from the DLP API, or None if an error occurs.
        """
        try:
            request = {
                "item": {"value": text},
                "inspectConfig": {"infoTypes": [{"name": info_type} for info_type in info_types]},
            }
            response = (
                self.service.projects()
                .inspect()
                .execute(name=f"projects/{project_id}", body=request)
            )
            return response
        except Exception as e:
            print(f"An error occurred during inspect_text: {e}")
            return None

    def redact_text(self, project_id: str, text: str, info_types: list, replace_with: str = "*"):
        """
        Redacts sensitive information from a text string.

        Args:
            project_id (str): The Google Cloud project ID.
            text (str): The text to redact.
            info_types (list): A list of info type strings (e.g., ["EMAIL_ADDRESS", "PHONE_NUMBER"]).
            replace_with (str, optional): The string to replace the sensitive data with. Defaults to "*".

        Returns:
            dict: The API response from the DLP API, or None if an error occurs.  Contains the redacted text.
        """
        try:
            request = {
                "item": {"value": text},
                "inspectConfig": {"infoTypes": [{"name": info_type} for info_type in info_types]},
                "replaceConfig": {"replacementText": replace_with},
            }
            response = (
                self.service.projects()
                .redact()
                .execute(name=f"projects/{project_id}", body=request)
            )
            return response
        except Exception as e:
            print(f"An error occurred during redact_text: {e}")
            return None


    def list_info_types(self):
        """
        Lists available info types.  Note: This isn't part of the core DLP API,
        but it is often useful.  This is a simplified approach, consult the
        official DLP documentation for the definitive and complete list.
        Returns:
            list:  A list of info type names, or None if an error occurs.
        """
        # This is a VERY simplified example.  DLP doesn't directly offer a list info types API.
        # This is for basic demonstration ONLY.  A proper implementation
        # would involve fetching from a data store, a curated list, or other methods.
        try:
            return [
                "EMAIL_ADDRESS",
                "PHONE_NUMBER",
                "CREDIT_CARD_NUMBER",
                "US_SOCIAL_SECURITY_NUMBER",
            ]
        except Exception as e:
            print(f"An error occurred during list_info_types: {e}")
            return None
```