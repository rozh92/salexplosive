// Importeer de benodigde functies van de Firebase SDK's
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Vervang dit object met de firebaseConfig die u uit uw Firebase projectinstellingen heeft gekopieerd.
// Dit is de 'digitale sleutel' die uw webapp verbindt met uw Firebase backend.
export const firebaseConfig = {
  apiKey: "AIzaSyAE4wy4bIbhrKSQeFH6cN6DVu1jOrtpY04",
  authDomain: "sales-copilot-fad44.firebaseapp.com",
  projectId: "sales-copilot-fad44",
  storageBucket: "sales-copilot-fad44.firebasestorage.app",
  messagingSenderId: "166925960707",
  appId: "1:166925960707:web:b38d24841c679bb453f036"
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
