# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Getting Started

1.  **Configurer les variables d'environnement**: Créez un fichier `.env` à la racine de votre projet. Vous devrez y ajouter vos propres clés API.

    ```.env
    # Obtenez votre clé API Gemini depuis Google AI Studio : https://aistudio.google.com/app/apikey
    GEMINI_API_KEY="VOTRE_CLE_API_GEMINI_ICI"

    # Obtenez votre clé API Google Maps depuis Google Cloud Console : https://console.cloud.google.com/google/maps-apis/
    # Assurez-vous d'activer la "Maps JavaScript API".
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="VOTRE_CLE_API_GOOGLE_MAPS_ICI"
    ```

2.  **Lancer le serveur de développement**:
    
    ```bash
    npm run dev
    ```
    
    Ouvrez [http://localhost:9002](http://localhost:9002) avec votre navigateur pour voir le résultat.

Pour commencer à modifier votre application, jetez un œil à `src/app/page.tsx`.
