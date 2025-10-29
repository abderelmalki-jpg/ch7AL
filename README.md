# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Getting Started

1.  **Set up Environment Variables**: Create a `.env` file in the root of the project by copying the example below. You'll need to add your own API keys from Google AI Studio and Google Cloud Console.

    ```.env
    # Get your Gemini API key from Google AI Studio: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

    # Get your Google Maps API key from Google Cloud Console: https://console.cloud.google.com/google/maps-apis/
    # Make sure to enable the "Maps JavaScript API".
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"
    ```

2.  **Run the development server**:
    
    ```bash
    npm run dev
    ```
    
    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

To get started editing your app, take a look at `src/app/page.tsx`.
