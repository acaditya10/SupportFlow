import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  authDomain: "support-flow-365.firebaseapp.com",
  projectId: "support-flow-365",
  storageBucket: "support-flow-365.firebasestorage.app",
  messagingSenderId: "830724300266",
  appId: "1:830724300266:web:56f371c329b5c5bc386693",
  measurementId: "G-170LLPH3QV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);