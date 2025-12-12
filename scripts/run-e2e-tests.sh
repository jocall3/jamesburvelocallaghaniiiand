#!/bin/bash

# Fail fast
set -e

# Default values
ENVIRONMENT="dev"
TEST_SUITE="all"
HEADLESS="true"
REPORTER="spec" # Default reporter: spec, list, dot, progress, etc.
TAGS="" # Comma-separated list of tags to filter tests

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -t|--test-suite)
      TEST_SUITE="$2"
      shift
      shift
      ;;
    -h|--headless)
      HEADLESS="$2"
      shift
      shift
      ;;
    -r|--reporter)
      REPORTER="$2"
      shift
      shift
      ;;
    --tags)
      TAGS="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown parameter passed: $1"
      exit 1
      ;;
  esac
done

# Log configuration
echo "Running E2E tests with the following configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Test Suite: $TEST_SUITE"
echo "  Headless: $HEADLESS"
echo "  Reporter: $REPORTER"
echo "  Tags: $TAGS"

# Define the command to execute based on the test suite
case "$TEST_SUITE" in
  all)
    TEST_COMMAND="npx playwright test"
    ;;
  api)
    TEST_COMMAND="npx playwright test tests/api"
    ;;
  ui)
    TEST_COMMAND="npx playwright test tests/ui"
    ;;
  *)
    TEST_COMMAND="npx playwright test tests/$TEST_SUITE" # Assume it's a directory or specific test file
    ;;
esac

# Add headless mode and reporter options
TEST_COMMAND="$TEST_COMMAND --reporter=$REPORTER"

if [ "$HEADLESS" = "true" ]; then
  TEST_COMMAND="$TEST_COMMAND --headed=false"
else
  TEST_COMMAND="$TEST_COMMAND --headed=true"
fi

# Add tag filtering if specified
if [ -n "$TAGS" ]; then
  TAGS_ESCAPED=$(echo "$TAGS" | sed 's/,/ /g') # Replace commas with spaces for Playwright's tag filter
  TEST_COMMAND="$TEST_COMMAND --grep \"@($TAGS_ESCAPED)\""
fi

# Environment-specific setup (example: setting API endpoint)
case "$ENVIRONMENT" in
  dev)
    export API_ENDPOINT="https://dev.example.com/api"
    ;;
  staging)
    export API_ENDPOINT="https://staging.example.com/api"
    ;;
  prod)
    export API_ENDPOINT="https://example.com/api"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT. Using default configuration."
    ;;
esac

# Execute the tests
echo "Executing command: $TEST_COMMAND"
eval "$TEST_COMMAND"

echo "E2E tests completed."