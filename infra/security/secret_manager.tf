# Secret Manager

# Create a Secret Manager secret to store the API key.
resource "google_secret_manager_secret" "api_key" {
  secret_id = "api-key"
  replication {
    automatic = true
  }
}

# Add a version to the secret with the actual API key value.  This should ideally
# be populated via a CI/CD pipeline or manually via `terraform apply -var`.
resource "google_secret_manager_secret_version" "api_key_version" {
  secret = google_secret_manager_secret.api_key.id
  # Replace with the actual API key value. DO NOT hardcode in the repository.
  secret_data = "YOUR_API_KEY_HERE"
}

# Example:  Allow a specific service account to access the secret.
# Adjust the member and role based on your requirements.
resource "google_secret_manager_secret_iam_member" "secret_access" {
  secret  = google_secret_manager_secret.api_key.id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:your-service-account@your-project-id.iam.gserviceaccount.com"
}

#Output the secret name to be used by other components
output "secret_name" {
  value = google_secret_manager_secret.api_key.id
  description = "The name of the Secret Manager secret."
}