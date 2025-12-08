
# Ch7al - Price Sharing App

This is a Next.js application for community-based price sharing.

## Getting Started

### 1. Configure Environment Variables

Create a `.env` file in the root of your project by copying the example below. You will need to add your own API keys for the app to function correctly.

```.env
# ==== Google AI (for Image Recognition) ====
# CRITICAL: Get this API key from Google AI Studio.
# The image recognition feature will NOT work without this key.
# https://makersuite.google.com/app/apikey
GEMINI_API_KEY="your-google-ai-api-key-here"

# ==== Firebase Client SDK Configuration ====
# These are public keys and are safe to be exposed on the client-side.
# Get these from your Firebase project settings under "General".
# https://console.firebase.google.com/project/_/settings/general/
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyAJuQu1zUjvst6GevnVUAJe17ew7PhxODs"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hanouti-6ce26.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="hanouti-6ce26"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="hanouti-6ce26.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="252246765953"
NEXT_PUBLIC_FIREBASE_APP_ID="1:252246765953:web:726dc032c6eeba126bb880"
NEXT_PUBLIC_BASE_URL="http://localhost:9002"

# ==== Firebase Admin SDK (for Server Actions) ====
# CRITICAL: These are private keys and must be kept secret.
# Get these values from your Firebase project settings:
# Go to Project Settings > Service accounts > Generate new private key
# https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk
FIREBASE_CLIENT_EMAIL="your-service-account-email-here"
FIREBASE_PRIVATE_KEY="your-private-key-here"

# ==== Google Maps API (for Client-side) ====
# IMPORTANT: Get your Google Maps API key from the Google Cloud Console.
# Make sure to enable the "Maps JavaScript API" for your project.
# The map on the dashboard will not work without this key.
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyAJuQu1zUjvst6GevnVUAJe17ew7PhxODs"
```

**Important Note on `FIREBASE_PRIVATE_KEY`**: When you copy the private key from the JSON file you downloaded, it will contain newline characters (`\n`). You must format it as a single line in your `.env` file, replacing the newlines with `\n`. For example:
`"-----BEGIN PRIVATE KEY-----\nMIIC...rest_of_the_key...\n-----END PRIVATE KEY-----\n"`

**CRITICAL: The maps, image recognition, and price submission features will NOT work until you replace the placeholder values with real, valid API keys.**

---

### Troubleshooting Google Maps Error (`ApiTargetBlockedMapError`)

If your map displays an error message stating that it's blocked, it's likely due to the API key restrictions in your Google Cloud project. To fix this:

1.  Go to the **Google Cloud Console** > **APIs & Services** > **Credentials**.
2.  Select your Google Maps API key.
3.  Under **Application restrictions**, ensure that you have selected **HTTP referrers (web sites)**.
4.  In the **Website restrictions** section, add the domains where your app is hosted. For development in this environment, you should add:
    *   `*.cloudworkstations.dev`
5.  If you are deploying to production, add your production domain as well (e.g., `your-app-name.web.app`).

This will explicitly authorize your application to use the API key.

---

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

To start editing your application, take a look at `src/app/page.tsx` and the main dashboard at `src/app/dashboard/page.tsx`.
