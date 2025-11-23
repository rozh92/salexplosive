// Importeer de benodigde functies van de Firebase SDK's
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Vervang dit object met de firebaseConfig die u uit uw Firebase projectinstellingen heeft gekopieerd.
// Dit is de 'digitale sleutel' die uw webapp verbindt met uw Firebase backend.
export const firebaseConfig = {
  apiKey: "AIzaSyBYgPPPg83xwrguxEZbxbnP_2QwEET8los",
  authDomain: "salexplosive.firebaseapp.com",
  projectId: "salexplosive",
  storageBucket: "salexplosive.firebasestorage.app",
  messagingSenderId: "642364074756",
  appId: "1:642364074756:web:b787af9924dc4626b6be51",
  measurementId: "G-SL43JRJE0V"
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
