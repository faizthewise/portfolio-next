import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Public web configuration. Firestore rules control access to wedding data.
const firebaseConfig = {
  apiKey: "AIzaSyCBE7ZgJ1pufv8mlHquq-lyEuxZVRRzaTQ",
  authDomain: "jemputan-kahwin-6bd29.firebaseapp.com",
  projectId: "jemputan-kahwin-6bd29",
  storageBucket: "jemputan-kahwin-6bd29.firebasestorage.app",
  messagingSenderId: "594355925255",
  appId: "1:594355925255:web:f3cbb7e152691ad1ba95a2",
};

// Lazy initialization keeps Firebase scoped to invitation features that use it.
export function getWeddingFirestore() {
  const name = "jemputan-perkahwinan";
  const app =
    getApps().find((existing) => existing.name === name) ??
    initializeApp(firebaseConfig, name);

  return getFirestore(app);
}

let signIn: Promise<string> | undefined;

export function getWeddingGuest(): Promise<string> {
  if (!signIn) {
    signIn = (async () => {
      const auth = getAuth(getWeddingFirestore().app);
      await auth.authStateReady();
      return auth.currentUser?.uid ?? (await signInAnonymously(auth)).user.uid;
    })().catch((error) => {
      signIn = undefined;
      throw error;
    });
  }
  return signIn;
}
