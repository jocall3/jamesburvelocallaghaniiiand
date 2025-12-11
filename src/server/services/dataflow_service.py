import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import logging

# Configure logging for the service
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataflowService:
    """
    Backend service for interacting with the Google Cloud Dataflow API.
    Provides methods to fetch job statuses and details.
    """

    _DATAFLOW_API_SERVICE_NAME = 'dataflow'
    _DATAFLOW_API_VERSION = 'v1b3'

    def __init__(self):
        """
        Initializes the Dataflow service client.
        Authenticates using default Google Cloud credentials (e.g., Application Default Credentials).
        """
        try:
            self.credentials, self.default_project_id = google.auth.default()
            
            if not self.credentials:
                raise ValueError("Google Cloud credentials could not be loaded. "
                                 "Ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are authenticated via `gcloud`.")
            
            if not self.default_project_id:
                logger.warning("Default project ID not found from environment or credentials. "
                               "Operations requiring project ID will need it explicitly passed.")
                # Attempt to get project from credentials if available (e.g., service account JSON)
                try:
                    if hasattr(self.credentials, 'project_id'):
                        self.default_project_id = self.credentials.project_id
                        if self.default_project_id:
                            logger.info(f"Default project ID set from credentials: {self.default_project_id}")
                except Exception as e:
                    logger.debug(f"Could not determine project ID from credentials object: {e}")

            self.service = build(
                self._DATAFLOW_API_SERVICE_NAME,
                self._DATAFLOW_API_VERSION,
                credentials=self.credentials,
                cache_discovery=True  # Cache the discovery document for better performance in production
            )
            logger.info("Dataflow service client initialized successfully.")
        except Exception as e:
            logger.exception(f"Failed to initialize Dataflow service client: {e}")
            self.service = None
            raise

    def _execute_api_call(self, request):
        """Helper to execute API requests and handle common errors."""
        if not self.service:
            logger.error("Dataflow service client not initialized.")
            raise ConnectionError("Dataflow service is not available. Check initialization errors.")
        
        try:
            return request.execute()
        except HttpError as e:
            error_details = f"Status: {e.resp.status}, Reason: {e.resp.reason}, Content: {e.content.decode()}"
            logger.error(f"Dataflow API HTTP error: {error_details}")
            raise
        except Exception as e:
            logger.exception(f"An unexpected error occurred during Dataflow API call.")
            raise

    def list_jobs(self, project_id: str = None, location: str = 'us-central1', page_size: int = 100, page_token: str = None):
        """
        Fetches a list of Dataflow jobs for a given project and location.

        Args:
            project_id: The ID of the GCP project. If None, uses the default project determined during initialization.
            location: The GCP region for the jobs (e.g., 'us-central1').
            page_size: The maximum number of jobs to return per page. Max 200.
            page_token: The `nextPageToken` from a previous request, if retrieving subsequent pages.

        Returns:
            A dictionary containing a list of jobs and a `nextPageToken` if more results exist.
            Example structure: `{'jobs': [...], 'nextPageToken': '...'}`

        Raises:
            ValueError: If project_id is not specified and a default cannot be determined.
            ConnectionError: If the Dataflow service client is not initialized.
            HttpError: If the Dataflow API returns an error.
            Exception: For other unexpected errors.
        """
        proj_id = project_id if project_id else self.default_project_id
        if not proj_id:
            raise ValueError("Project ID must be specified or available from default credentials/environment.")

        logger.info(f"Listing Dataflow jobs for project '{proj_id}' in location '{location}' (page size: {page_size})...")
        
        request = self.service.projects().locations().jobs().list(
            projectId=proj_id,
            location=location,
            pageSize=page_size,
            pageToken=page_token
        )
        return self._execute_api_call(request)

    def get_job(self, job_id: str, project_id: str = None, location: str = 'us-central1', view: str = 'JOB_VIEW_ALL'):
        """
        Fetches details for a specific Dataflow job.

        Args:
            job_id: The ID of the Dataflow job to retrieve.
            project_id: The ID of the GCP project. If None, uses the default project determined during initialization.
            location: The GCP region where the job is running (e.g., 'us-central1').
            view: Specifies the level of detail to return. Options:
                  'JOB_VIEW_UNKNOWN', 'JOB_VIEW_SUMMARY', 'JOB_VIEW_ALL', 'JOB_VIEW_DESCRIPTION'.
                  'JOB_VIEW_ALL' is recommended for comprehensive details.

        Returns:
            A dictionary containing the job details.

        Raises:
            ValueError: If project_id is not specified and a default cannot be determined.
            ConnectionError: If the Dataflow service client is not initialized.
            HttpError: If the Dataflow API returns an error (e.g., 404 if job not found).
            Exception: For other unexpected errors.
        """
        proj_id = project_id if project_id else self.default_project_id
        if not proj_id:
            raise ValueError("Project ID must be specified or available from default credentials/environment.")

        logger.info(f"Fetching Dataflow job '{job_id}' for project '{proj_id}' in location '{location}' with view '{view}'...")
        
        request = self.service.projects().locations().jobs().get(
            projectId=proj_id,
            location=location,
            jobId=job_id,
            view=view
        )
        return self._execute_api_call(request)