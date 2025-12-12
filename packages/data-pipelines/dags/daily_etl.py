from __future__ import annotations

import pendulum

from airflow.decorators import dag, task
from airflow.providers.snowflake.operators.snowflake import SnowflakeOperator
from airflow.models.baseoperator import chain

SNOWFLAKE_CONN_ID = "snowflake_default"
WAREHOUSE = "TRANSFORMING"
DATABASE = "WAREHOUSE"
SCHEMA = "PUBLIC"

@dag(
    schedule="@daily",
    start_date=pendulum.datetime(2023, 1, 1, tz="UTC"),
    catchup=False,
    tags=["data_pipelines", "etl", "snowflake"],
)
def daily_etl():
    """
    ### Daily ETL Pipeline
    This DAG runs daily ETL jobs to move data from service databases to the data warehouse.
    """

    @task(task_id="extract_data")
    def extract_data_task():
        """
        #### Extract data task
        Simulates extracting data from a service database.
        In a real-world scenario, this would involve connecting to a database
        (e.g., PostgreSQL, MySQL) and querying the necessary tables.
        For simplicity, this task returns a placeholder message.
        """
        return "Data extracted successfully from service database."

    @task(task_id="transform_data")
    def transform_data_task(extract_result: str):
        """
        #### Transform data task
        Transforms the extracted data. This could involve cleaning, filtering,
        and aggregating the data.
        For simplicity, this task returns a placeholder message.
        """
        print(extract_result)  # Demonstrates passing data between tasks
        return "Data transformed successfully."

    load_data = SnowflakeOperator(
        task_id="load_data",
        snowflake_conn_id=SNOWFLAKE_CONN_ID,
        sql=[
            f"USE WAREHOUSE {WAREHOUSE};",
            f"USE DATABASE {DATABASE};",
            f"USE SCHEMA {SCHEMA};",
            """
            CREATE OR REPLACE TABLE daily_etl_data (
                timestamp TIMESTAMP_NTZ,
                message VARCHAR
            );
            """,
            """
            INSERT INTO daily_etl_data (timestamp, message)
            VALUES (CURRENT_TIMESTAMP(), 'Data loaded successfully.');
            """,
        ],
    )

    @task(task_id="data_quality_checks")
    def data_quality_checks_task():
        """
        #### Data quality checks task
        Performs data quality checks on the loaded data.
        This could involve checking for null values, data type validation,
        and ensuring data consistency.
        For simplicity, this task returns a placeholder message.
        """
        return "Data quality checks passed."

    extract = extract_data_task()
    transform = transform_data_task(extract)
    quality_checks = data_quality_checks_task()

    chain(transform, load_data, quality_checks)


daily_etl()