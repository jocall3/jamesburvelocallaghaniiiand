import abc
from typing import List, Dict, Any, Optional

from googleapiclient.discovery import Resource


class BaseApiService(abc.ABC):
    """Abstract base class for all Google API service wrappers."""

    def __init__(self, service: Resource):
        """
        Initializes the BaseApiService.

        Args:
            service: The authenticated Google API service object from googleapiclient.discovery.build().
        """
        self.service = service

    @property
    @abc.abstractmethod
    def api_name(self) -> str:
        """The official name of the API, e.g., 'sheets'."""
        raise NotImplementedError

    @property
    @abc.abstractmethod
    def api_version(self) -> str:
        """The version of the API, e.g., 'v4'."""
        raise NotImplementedError

    def get_api_title(self) -> Optional[str]:
        """
        Returns the title of the API from the discovery document.

        Returns:
            The API title as a string, or None if not found.
        """
        # The discovery document is stored in the service object's model
        return self.service._resourceDesc.get('title')

    @abc.abstractmethod
    def get_permissions(self) -> List[str]:
        """
        Retrieves a list of all IAM permissions for this service.

        This method must be implemented by each subclass, as the way to
        fetch permissions can vary significantly between APIs. Some might
        not support it at all.

        Returns:
            A list of permission strings (e.g., 'pubsub.topics.publish').
            Returns an empty list if the API does not support this or if
            no permissions are found.
        """
        raise NotImplementedError

    def get_quota_info(self) -> Dict[str, Any]:
        """
        Retrieves quota information for the service for the current project.

        This is a placeholder as fetching quota is highly specific and often
        not available via the service's primary API. It might require using
        the Service Usage API or Cloud Monitoring API instead. Subclasses
        can override this if they have a direct way to get quota info.

        Returns:
            A dictionary containing quota information. Defaults to an empty dict.
        """
        return {}

    def get_discovery_doc(self) -> Dict[str, Any]:
        """
        Returns the raw discovery document for the service.

        Returns:
            A dictionary representing the JSON discovery document.
        """
        return self.service._resourceDesc