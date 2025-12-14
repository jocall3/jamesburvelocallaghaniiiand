# API Authentication

Access to the API is protected and requires authentication for all requests. We support two primary methods of authentication to cater to different use cases: **Bearer Tokens (OAuth 2.0)** for user-centric applications and **API Keys** for server-to-server integrations and automated scripts.

All API requests must be made over HTTPS. Calls made over plain HTTP will fail. Unauthenticated requests will result in a `401 Unauthorized` response.

---

## 1. Bearer Token Authentication (OAuth 2.0)

Bearer Token authentication is the recommended method for applications acting on behalf of a user. This method uses short-lived JSON Web Tokens (JWTs) that are granted after a user successfully authenticates.

### Obtaining a Bearer Token

To obtain a Bearer Token, you must make a `POST` request to our token endpoint (e.g., `/api/v1/oauth/token`). This process follows the standard OAuth 2.0 `password` or `client_credentials` grant type flow, which will be detailed in the specific endpoint documentation.

Once you have a valid token, you must include it in the `Authorization` header of every subsequent API request.

### Using the Bearer Token

The token must be prefixed with the string `Bearer ` (note the trailing space).

**Header Format:**

```
Authorization: Bearer <YOUR_JWT_ACCESS_TOKEN>
```

**Example `curl` Request:**

```bash
curl -X GET "https://api.example.com/v1/users/me" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

### Token Lifecycle

-   **Expiration:** Access tokens are short-lived for security reasons. The expiration time (`expires_in`) is provided when the token is issued. Your application must handle token expiration gracefully.
-   **Refreshing Tokens:** When an access token expires, you can use the `refresh_token` (provided during the initial token grant) to obtain a new access token without requiring the user to re-authenticate.

---

## 2. API Key Authentication

API Key authentication is ideal for server-to-server communication, background services, or scripts where a user is not directly involved. Each API key is unique to your account or service and should be treated as a password.

### Obtaining an API Key

You can generate and manage your API keys from your account settings in the developer dashboard. You may be able to create multiple keys with different permission scopes for enhanced security.

### Using the API Key

To authenticate with an API key, you must include it in the `X-API-Key` custom HTTP header on every request.

**Header Format:**

```
X-API-Key: <YOUR_API_KEY>
```

**Example `curl` Request:**

```bash
curl -X GET "https://api.example.com/v1/analytics/reports" \
     -H "X-API-Key: sk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456"
```

---

## Authentication Errors

If your request is not properly authenticated, the API will return an error response.

-   **`401 Unauthorized`**: This error is returned if you provide no authentication credentials, or if the credentials provided (Bearer Token or API Key) are invalid, malformed, or expired.
    -   **Troubleshooting:**
        -   Ensure the `Authorization` or `X-API-Key` header is correctly formatted.
        -   Verify that your token or key is correct and has not been revoked.
        -   If using a Bearer Token, check if it has expired and refresh it if necessary.

-   **`403 Forbidden`**: This error is returned if your credentials are valid, but they do not grant permission to access the requested resource or perform the requested action.
    -   **Troubleshooting:**
        -   Check the permission scopes associated with your API Key or the user account tied to your Bearer Token.
        -   Ensure the resource you are trying to access is available for your account's subscription level.

---

## Security Best Practices

-   **Keep Credentials Secret:** Never expose your API Keys or Bearer Tokens in publicly accessible areas such as client-side code, public code repositories, or unsecured storage.
-   **Use Environment Variables:** Store your credentials in secure environment variables on your server.
-   **Principle of Least Privilege:** When generating API Keys, grant them only the permissions necessary for your application to function.
-   **Rotate Keys:** Periodically rotate your API keys to limit the impact of a potential compromise.
-   **Use HTTPS:** Always connect to the API over a secure `https` connection to protect credentials and data in transit.