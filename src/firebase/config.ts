// Importeer de benodigde functies van de Firebase SDK's
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Vervang dit object met de firebaseConfig die u uit uw Firebase projectinstellingen heeft gekopieerd.
// Dit is de 'digitale sleutel' die uw webapp verbindt met uw Firebase backend.
export const firebaseConfig = {
  apiKey: "PLAK_HIER_JE_NIEUWE_API_KEY",
  authDomain: "salexplosive.firebaseapp.com",
  projectId: "salexplosive",
  storageBucket: "salexplosive.firebasestorage.app",
  messagingSenderId: "PLAK_HIER_JE_SENDER_ID",
  appId: "PLAK_HIER_JE_APP_ID",
  measurementId: "G-OPTIONAL"
};

// Initialiseer de Firebase app
export const app = initializeApp(firebaseConfig);

// Initialiseer en exporteer de Firebase diensten die we gaan gebruiken
export const auth = getAuth(app);
// Initialiseer Firestore met de nieuwe, aanbevolen methode voor persistentie.
// Dit vervangt de verouderde `getFirestore()` + `enableIndexedDbPersistence()` combinatie.
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const storage = getStorage(app);
