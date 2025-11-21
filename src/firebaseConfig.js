// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZ3Eb6-pc8pVcjYEOSLmf6tX2xxkYG5Lc",
  authDomain: "brainstorm-49fee.firebaseapp.com",
  projectId: "brainstorm-49fee",
  storageBucket: "brainstorm-49fee.firebasestorage.app",
  messagingSenderId: "850708988211",
  appId: "1:850708988211:web:fd21c278fd4a9e5956be46",
  measurementId: "G-WH0XE6E5Q3"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app); // ✅ Firestore reference

console.log("✅ Firebase connected:", app.name);
