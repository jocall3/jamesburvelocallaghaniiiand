```python
from google.cloud import spanner
from google.cloud.spanner_admin_database_v1.types import DatabaseAdmin
from google.api_core.exceptions import NotFound

class SpannerService:
    """
    Backend service wrapper for all interactions with the Google Cloud Spanner API.
    """

    def __init__(self, project_id: str, instance_id: str, database_id: str):
        """
        Initializes the SpannerService.

        Args:
            project_id: The Google Cloud project ID.
            instance_id: The Spanner instance ID.
            database_id: The Spanner database ID.
        """
        self.project_id = project_id
        self.instance_id = instance_id
        self.database_id = database_id
        self.spanner_client = spanner.Client(project=self.project_id)
        self.instance = self.spanner_client.instance(self.instance_id)
        self.database = self.instance.database(self.database_id)

    def _get_database_admin_client(self) -> DatabaseAdmin.DatabaseAdminClient:
        """
        Returns a DatabaseAdmin client for managing Spanner databases.
        """
        return DatabaseAdmin.DatabaseAdminClient()

    def create_table(self, table_name: str, schema: list) -> None:
        """
        Creates a new table in the Spanner database.

        Args:
            table_name: The name of the table to create.
            schema: A list of spanner.SchemaField objects defining the table schema.
        """
        with self.database.batch() as batch:
            batch.create_table(table_name, schema)
        print(f"Table '{table_name}' created successfully.")

    def insert_rows(self, table_name: str, columns: list, values: list) -> None:
        """
        Inserts rows into a Spanner table.

        Args:
            table_name: The name of the table to insert into.
            columns: A list of column names.
            values: A list of lists, where each inner list represents a row of values.
        """
        with self.database.batch() as batch:
            batch.insert(
                table=table_name,
                columns=columns,
                values=values,
            )
        print(f"{len(values)} rows inserted into '{table_name}'.")

    def read_rows(self, table_name: str, columns: list, key_set: spanner.KeySet) -> list:
        """
        Reads rows from a Spanner table.

        Args:
            table_name: The name of the table to read from.
            columns: A list of column names to retrieve.
            key_set: A spanner.KeySet object specifying which rows to read.

        Returns:
            A list of rows, where each row is a tuple of values.
        """
        with self.database.snapshot() as snapshot:
            results = snapshot.read(
                table=table_name,
                columns=columns,
                keyset=key_set,
            )
            return list(results)

    def execute_sql(self, sql: str, params: dict = None, param_types: dict = None) -> list:
        """
        Executes a SQL query against the Spanner database.

        Args:
            sql: The SQL query string.
            params: A dictionary of parameters for the query.
            param_types: A dictionary of parameter types for the query.

        Returns:
            A list of rows returned by the query.
        """
        with self.database.snapshot() as snapshot:
            results = snapshot.execute_sql(
                sql,
                params=params,
                param_types=param_types
            )
            return list(results)

    def update_rows(self, table_name: str, columns: list, values: list) -> None:
        """
        Updates rows in a Spanner table.

        Args:
            table_name: The name of the table to update.
            columns: A list of column names to update.
            values: A list of lists, where each inner list represents a row of values to update.
        """
        with self.database.batch() as batch:
            batch.update(
                table=table_name,
                columns=columns,
                values=values,
            )
        print(f"Rows updated in '{table_name}'.")

    def delete_rows(self, table_name: str, key_set: spanner.KeySet) -> None:
        """
        Deletes rows from a Spanner table.

        Args:
            table_name: The name of the table to delete from.
            key_set: A spanner.KeySet object specifying which rows to delete.
        """
        with self.database.batch() as batch:
            batch.delete(
                table=table_name,
                keyset=key_set,
            )
        print(f"Rows deleted from '{table_name}'.")

    def get_table_schema(self, table_name: str) -> list:
        """
        Retrieves the schema of a Spanner table.

        Args:
            table_name: The name of the table.

        Returns:
            A list of spanner.SchemaField objects representing the table schema.
        """
        try:
            with self.database.snapshot() as snapshot:
                table_info = snapshot.get_table_ddl([table_name])
                # The get_table_ddl returns a list of DDL statements, we need to parse the schema
                # For simplicity, we assume only one table is requested and its schema is the first one
                # A more robust solution might involve parsing the DDL string
                return table_info # This returns DDL, not SchemaField objects directly.
                                  # To get SchemaField objects, one would typically query metadata tables or use specific admin APIs.
        except NotFound:
            print(f"Table '{table_name}' not found.")
            return []

    def check_table_exists(self, table_name: str) -> bool:
        """
        Checks if a table exists in the Spanner database.

        Args:
            table_name: The name of the table to check.

        Returns:
            True if the table exists, False otherwise.
        """
        try:
            self.get_table_schema(table_name)
            return True
        except Exception: # Catching a general exception here as get_table_schema might raise various issues
            return False

    def create_database_if_not_exists(self) -> None:
        """
        Creates the Spanner database if it does not already exist.
        This method is a placeholder and requires proper database creation logic
        which typically involves instance administration. For a service wrapper,
        it's often assumed the database already exists.
        """
        print("Note: Database creation is typically handled at the instance level and may require administrative privileges.")
        print(f"Attempting to access database '{self.database_id}'. If it doesn't exist, an error will occur.")
        try:
            # A simple way to check if the database exists is to try to access it.
            # If it doesn't exist, the client will raise an error.
            self.database.run_in_transaction(lambda txn: txn.execute_sql("SELECT 1"))
            print(f"Database '{self.database_id}' already exists.")
        except NotFound:
            print(f"Database '{self.database_id}' not found. Manual creation is required.")
        except Exception as e:
            print(f"An error occurred while checking for database '{self.database_id}': {e}")

```