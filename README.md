# Ch3rel - Price Sharing App

This is a Next.js application for community-based price sharing.

## Getting Started

1.  **Configure Environment Variables**: Create a `.env` file in the root of your project. You will need to add your own API keys.

    ```.env
    # ==== Firebase Admin SDK (for Server Actions) ====
    # Get these values from your Firebase project settings:
    # Go to Project Settings > Service accounts > Generate new private key
    # https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id-here"
    FIREBASE_CLIENT_EMAIL="your-service-account-email-here"
    FIREBASE_PRIVATE_KEY="your-private-key-here"

    # ==== Google Maps API (for Client-side) ====
    # IMPORTANT: Get your Google Maps API key from the Google Cloud Console: https://console.cloud.google.com/google/maps-apis/
    # Make sure to enable the "Maps JavaScript API" for your project.
    # The map on the dashboard will not work without this key.
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"
    ```
    
    **Important Note on `FIREBASE_PRIVATE_KEY`**: When you copy the private key from the JSON file you downloaded, it will contain newline characters (`\n`). You must format it as a single line in your `.env` file, replacing the newlines with `\n`. For example:
    `"-----BEGIN PRIVATE KEY-----\nMIIC...rest_of_the_key...\n-----END PRIVATE KEY-----\n"`


2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Development Server**:
    
    ```bash
    npm run dev
    ```
    
    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

To start editing your application, take a look at `src/app/page.tsx` and the main dashboard at `src/app/dashboard/page.tsx`.
