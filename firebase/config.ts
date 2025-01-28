import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, } from 'firebase/auth';
import { getFirestore, enableNetwork, } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCxEWFCQGd5DpFd5NUQBRtLev-GIwUiz_4",
  authDomain: "attendanceapp-ee027.firebaseapp.com",
  projectId: "attendanceapp-ee027",
  storageBucket: "attendanceapp-ee027.firebasestorage.app",
  messagingSenderId: "854959312573",
  appId: "1:854959312573:android:8f2806882fba83f0ab71d4",
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage) 
});

console.log("Firebase inicializado:", app);

const db = getFirestore(app);

enableNetwork(db)
  .then(() => {
    console.log("Firestore está en línea");
  })
  .catch((error) => {
    console.error("Error al conectar a Firestore:", error);
  });

export { db };