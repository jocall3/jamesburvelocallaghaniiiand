```python
from google.cloud import resourcemanager_v3
from google.api_core import exceptions

class ResourceManagerService:
    def __init__(self):
        self.client = resourcemanager_v3.ProjectsClient()

    def get_project(self, project_id):
        """
        Retrieves a project given its project ID.

        Args:
            project_id (str): The ID of the project.

        Returns:
            google.cloud.resourcemanager_v3.types.Project: The project object, or None if not found.

        Raises:
            google.api_core.exceptions.NotFound: If the project does not exist.
            Exception: For other errors during the API call.
        """
        try:
            project = self.client.get_project(name=f"projects/{project_id}")
            return project
        except exceptions.NotFound:
            return None  # Project not found
        except Exception as e:
            raise Exception(f"Error retrieving project: {e}")
        
    def list_projects(self, parent=None):
        """Lists projects under a given parent (organization or folder).

        Args:
            parent (str, optional): The parent resource. Can be an organization or folder.
                                     For example, 'organizations/123' or 'folders/456'.
                                     If None, lists all projects the user has access to. Defaults to None.

        Returns:
            list[google.cloud.resourcemanager_v3.types.Project]: A list of project objects.
            Returns an empty list if no projects are found or if an error occurs.

        Raises:
            Exception: For errors during the API call.
        """
        try:
            if parent:
                request = resourcemanager_v3.ListProjectsRequest(parent=parent)
                projects = list(self.client.list_projects(request=request))
            else:
                projects = list(self.client.list_projects())
            return projects
        except Exception as e:
            print(f"Error listing projects: {e}")
            return []

    def create_project(self, project_id, display_name, parent):
        """Creates a new project.

        Args:
            project_id (str): The ID of the project.
            display_name (str): The display name of the project.
            parent (str): The parent resource (organization or folder).
                            For example, 'organizations/123' or 'folders/456'.

        Returns:
            google.api_core.future.polling.Operation: An Operation object that can be used to track the progress of the project creation.

        Raises:
            Exception: For errors during the API call.
        """
        try:
            project = resourcemanager_v3.Project()
            project.project_id = project_id
            project.display_name = display_name
            operation = self.client.create_project(project=project, parent=parent)
            return operation
        except Exception as e:
            raise Exception(f"Error creating project: {e}")
```