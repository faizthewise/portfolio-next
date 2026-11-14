import { getApps, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// Public web configuration. Firestore rules control access to wedding data.
const firebaseConfig = {
  apiKey: "AIzaSyCBE7ZgJ1pufv8mlHquq-lyEuxZVRRzaTQ",
  authDomain: "jemputan-kahwin-6bd29.firebaseapp.com",
  projectId: "jemputan-kahwin-6bd29",
  storageBucket: "jemputan-kahwin-6bd29.firebasestorage.app",
  messagingSenderId: "594355925255",
  appId: "1:594355925255:web:f3cbb7e152691ad1ba95a2",
};
const useEmulators =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_WEDDING_EMULATORS === "1";
if (useEmulators) firebaseConfig.projectId = "demo-wedding";
let firestoreConnected = false;
let authConnected = false;
let storageConnected = false;
let ownerFirestoreConnected = false;
let ownerAuthConnected = false;
let ownerStorageConnected = false;
let guestSignIn: Promise<string> | undefined;

// Lazy initialization keeps Firebase scoped to invitation features that use it.
export function getWeddingFirestore() {
  const name = "jemputan-perkahwinan";
  const app =
    getApps().find((existing) => existing.name === name) ??
    initializeApp(firebaseConfig, name);

  const db = getFirestore(app);
  if (useEmulators && !firestoreConnected) {
    connectFirestoreEmulator(db, "127.0.0.1", 8088);
    firestoreConnected = true;
  }
  return db;
}

function appFor(name: string) {
  return (
    getApps().find((existing) => existing.name === name) ??
    initializeApp(firebaseConfig, name)
  );
}

export function getWeddingOwnerFirestore() {
  const app = appFor("jemputan-perkahwinan-owner");
  const db = getFirestore(app);
  if (useEmulators && !ownerFirestoreConnected) {
    connectFirestoreEmulator(db, "127.0.0.1", 8088);
    ownerFirestoreConnected = true;
  }
  return db;
}

export function getWeddingStorage() {
  const storage = getStorage(getWeddingFirestore().app);
  if (useEmulators && !storageConnected) {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    storageConnected = true;
  }
  return storage;
}

export function getWeddingOwnerStorage() {
  const storage = getStorage(getWeddingOwnerFirestore().app);
  if (useEmulators && !ownerStorageConnected) {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    ownerStorageConnected = true;
  }
  return storage;
}

export function getWeddingAuth() {
  const auth = getAuth(getWeddingFirestore().app);
  if (useEmulators && !authConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    authConnected = true;
  }
  return auth;
}

export function getWeddingOwnerAuth() {
  const auth = getAuth(getWeddingOwnerFirestore().app);
  if (useEmulators && !ownerAuthConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    ownerAuthConnected = true;
  }
  return auth;
}

export function getWeddingGuest(): Promise<string> {
  const auth = getWeddingAuth();
  return (async () => {
    await auth.authStateReady();
    if (auth.currentUser) return auth.currentUser.uid;
    if (!guestSignIn) {
      guestSignIn = signInAnonymously(auth)
        .then(({ user }) => user.uid)
        .finally(() => {
          guestSignIn = undefined;
        });
    }
    return guestSignIn;
  })();
}
