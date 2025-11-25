# Rapport Technique de l'Application "CH7AL"

## 1. Concept et Objectif

**CH7AL** est une application mobile et web communautaire conçue pour le marché marocain. Son objectif principal est de permettre aux utilisateurs de trouver et de partager les prix de produits de consommation courante vendus dans les commerces de proximité ("hanouts").

En s'appuyant sur la contribution des utilisateurs, l'application vise à créer une base de données de prix transparente, aidant la communauté à réaliser des économies et à trouver les meilleures offres autour d'eux.

## 2. Architecture Technologique et Logique Applicative

Cette section détaille la logique de chaque fonctionnalité majeure pour faciliter son portage ou sa ré-implémentation sur d'autres plateformes comme Capacitor, Flutter ou Kotlin.

### Technologies Clés
| Domaine | Technologie | Rôle |
| :--- | :--- | :--- |
| **Framework Web** | Next.js (App Router) | Structure de l'application web. |
| **Base de Données** | Firebase Firestore | Stockage des données (utilisateurs, prix, etc.). |
| **Authentification**| Firebase Authentication | Gestion des utilisateurs. |
| **Stockage Fichiers**| Firebase Storage | Hébergement des images de produits. |
| **IA (Backend)** | Genkit (Google AI) | Reconnaissance de produits à partir d'images. |
| **Recherche** | Algolia | Moteur de recherche pour les produits. |
| **Wrapper Natif** | Capacitor | Empaquette l'application web pour Android/iOS. |

---

## 3. Logique des Fonctionnalités Clés (Guide de Portage)

### 3.1 Authentification (Connexion / Inscription)

La logique d'authentification est gérée par le **SDK Web de Firebase (`firebase/auth`)**. Cette logique est directement réutilisable dans le contexte d'une WebView Capacitor.

**Fichiers de référence :**
*   `src/app/auth/page.tsx`
*   `src/firebase/non-blocking-login.tsx` (contient les appels à Firebase)
*   `src/firebase/provider.tsx` (gère l'état de l'utilisateur)

#### Logique d'implémentation :

1.  **Initialisation de Firebase** : Le SDK Firebase est initialisé une seule fois.
2.  **Inscription par Email** :
    ```typescript
    // Extrait de src/firebase/non-blocking-login.tsx
    import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

    async function handleEmailSignUp(auth: Auth, username: string, email: string, password: string) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Après la création, mettre à jour le profil avec le nom d'utilisateur
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: username });
        }
        return userCredential;
      } catch (error) {
        console.error("Erreur d'inscription:", error);
        // Gérer les erreurs (ex: email déjà utilisé)
      }
    }
    ```
3.  **Connexion par Google** : Utilise le flux `signInWithPopup`. Capacitor gère bien les popups.
    ```typescript
    // Extrait de src/firebase/non-blocking-login.tsx
    import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

    function handleGoogleSignIn(auth: Auth) {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider).catch(error => {
        // Gérer les erreurs (ex: popup fermée par l'utilisateur)
      });
    }
    ```
4.  **Gestion de la session** : Un écouteur (`onAuthStateChanged` dans `src/firebase/provider.tsx`) détecte les changements d'état de connexion et met à jour l'interface. C'est à ce moment que le profil utilisateur est créé dans Firestore s'il n'existe pas.

### 3.2 Profil Utilisateur

Le profil stocke des informations supplémentaires non présentes dans Firebase Auth (points, badges, etc.).

**Fichier de référence :**
*   `src/app/profile/page.tsx`
*   `src/lib/types.ts` (pour la structure `UserProfile`)
*   `src/firebase/provider.tsx` (pour la création du profil)

#### Logique d'implémentation :

1.  **Structure des données** : La collection `/users/{userId}` dans Firestore contient des documents avec la structure `UserProfile`.
2.  **Création Automatique** : Lors de la première connexion d'un nouvel utilisateur, une fonction `createUserProfileIfNeeded` est appelée. Elle crée un document dans `/users` avec l'UID de l'utilisateur comme ID de document.
    ```typescript
    // Concept de création de profil
    async function createUserProfile(db: Firestore, user: User) {
      const userProfileRef = doc(db, 'users', user.uid);
      const userProfileSnap = await getDoc(userProfileRef);

      if (!userProfileSnap.exists()) {
        const newUserProfile = {
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          createdAt: serverTimestamp(),
          points: 0,
          badges: [],
          contributions: 0,
          language: 'fr'
        };
        await setDoc(userProfileRef, newUserProfile, { merge: true });
      }
    }
    ```
3.  **Affichage** : La page de profil récupère les données de `/users/{userId}` en temps réel en utilisant le hook `useDoc` de Firebase.

### 3.3 Caméra et Reconnaissance IA

C'est une fonctionnalité en plusieurs étapes : capture, envoi à l'IA, et traitement de la réponse.

**Fichiers de référence :**
*   `src/app/add-product/page.tsx` (pour la logique client)
*   `src/ai/flows/identify-product-flow.ts` (pour la logique IA backend)

#### Logique d'implémentation pour Capacitor :

1.  **Accès à la caméra (Capacitor)** : Il faut utiliser le plugin officiel `@capacitor/camera`.
    ```typescript
    import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

    async function takePicture() {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl, // Très important: Récupérer en DataURI
          source: CameraSource.Camera
        });

        // image.dataUrl contient quelque chose comme "data:image/jpeg;base64,..."
        return image.dataUrl;
      } catch (error) {
        console.error("Erreur caméra:", error);
        // Gérer le cas où l'utilisateur annule ou refuse la permission
        return null;
      }
    }
    ```
2.  **Appel de l'IA (Genkit)** : Le `dataUrl` obtenu est envoyé au flux Genkit via une simple requête `fetch`.
    ```typescript
    // Extrait de src/app/add-product/page.tsx
    import { identifyProduct } from '@/ai/flows/identify-product-flow';

    async function handleImageRecognition(dataUrl: string) {
      try {
        // La fonction `identifyProduct` est un Server Action Next.js,
        // qui est en fait une API POST. Pour une app externe, il faudrait
        // exposer ce flux via une Cloud Function HTTP.
        const result = await identifyProduct({ photoDataUri: dataUrl });
        // result contient { name: "...", brand: "...", category: "..." }
        return result;
      } catch (error) {
        console.error("Erreur de reconnaissance IA:", error);
        // Gérer les erreurs, notamment la surcharge du modèle (503)
      }
    }
    ```
    **Note pour une app native :** Le flux Genkit doit être déployé comme une fonction Cloud HTTP sécurisée (par ex. avec Firebase Auth) pour être appelé depuis l'extérieur du projet Next.js.

### 3.4 Géolocalisation et Carte

La logique consiste à obtenir les coordonnées GPS et à les afficher sur une carte.

**Fichiers de référence :**
*   `src/app/add-product/page.tsx` (pour obtenir la position)
*   `src/app/(main)/map/map-client.tsx` (pour afficher la carte)

#### Logique d'implémentation pour Capacitor :

1.  **Obtenir la position (Capacitor)** : Utiliser le plugin `@capacitor/geolocation`.
    ```typescript
    import { Geolocation } from '@capacitor/geolocation';

    async function getCurrentPosition() {
      try {
        const coordinates = await Geolocation.getCurrentPosition();
        return {
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude
        };
      } catch (error) {
        console.error("Erreur de géolocalisation:", error);
        // Gérer le refus de permission
        return null;
      }
    }
    ```
2.  **Affichage de la carte** : L'implémentation actuelle utilise `@vis.gl/react-google-maps`. Pour une application native, vous avez plusieurs options :
    *   **Simple** : Un bouton "Ouvrir dans Maps" qui ouvre Google Maps ou OpenStreetMap avec un lien contenant les coordonnées. `https://maps.google.com/?q=latitude,longitude`.
    *   **Intégrée** : Utiliser un SDK de carte natif pour Flutter/Kotlin/Swift, ou un composant de carte React Native pour Capacitor (comme `capacitor-google-maps`) pour une expérience intégrée.

### 3.5 Ajout d'un Prix

C'est le cœur de l'application, qui combine plusieurs logiques.

**Fichier de référence :** `src/app/add-product/actions.ts`

#### Logique d'implémentation :

1.  **Collecte des données** : Un formulaire recueille toutes les informations (nom, prix, magasin, localisation, etc.).
2.  **Upload de l'image (si présente)** : Si une photo a été prise, elle est d'abord uploadée sur **Firebase Storage**.
    ```typescript
    import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

    async function uploadImage(storage: Storage, dataUrl: string, userId: string) {
      const imagePath = `products/${userId}/${Date.now()}.jpg`;
      const imageRef = ref(storage, imagePath);
      await uploadString(imageRef, dataUrl, 'data_url');
      const imageUrl = await getDownloadURL(imageRef);
      return imageUrl;
    }
    ```
3.  **Création des documents (Produit, Magasin, Prix)** : La logique `getOrCreateStore` et `getOrCreateProduct` dans `actions.ts` est cruciale. Elle évite les doublons en cherchant d'abord si l'entité existe avant de la créer.
4.  **Enregistrement du prix** : Toutes les données, y compris les ID du produit et du magasin, et l'URL de l'image (si elle existe), sont enregistrées comme un nouveau document dans la collection `/prices` de Firestore.
    ```typescript
    // Concept de soumission
    async function submitPrice(db: Firestore, priceData: Omit<Price, 'id'>) {
      const pricesRef = collection(db, 'prices');
      await addDoc(pricesRef, {
        ...priceData,
        createdAt: serverTimestamp() // Important pour trier par date
      });

      // Mettre à jour les points de l'utilisateur
      const userRef = doc(db, 'users', priceData.userId);
      await updateDoc(userRef, { 
          points: increment(10),
          contributions: increment(1)
      });
    }
    ```
Ce rapport devrait vous donner toutes les clés pour comprendre et adapter la logique de l'application CH7AL à n'importe quelle plateforme native.