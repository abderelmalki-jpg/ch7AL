# Firebase Functions for Ch7al

This directory contains the backend logic for the Ch7al application, running on Firebase Cloud Functions.

## Environment Configuration

For the functions to connect to external services like Algolia, you must configure environment variables within Firebase. These are secret keys that should not be stored in your code directly.

You can set them by running the following commands from your terminal, replacing the placeholder values with your actual keys from your Algolia dashboard.

```bash
# Set your Algolia Application ID
firebase functions:config:set algolia.app_id="YOUR_ALGOLIA_APP_ID"

# Set your Algolia ADMIN API Key (this is the secret key with write permissions)
firebase functions:config:set algolia.api_key="YOUR_ALGOLIA_ADMIN_API_KEY"
```

After setting the configuration, you can deploy your functions:

```bash
firebase deploy --only functions
```

This ensures that your secret keys are stored securely in the Firebase environment and are accessible to your functions at runtime via `functions.config()`.
