import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDGBbClktMxkjowfpQaRj0xWD6AOXdP90Y",
  authDomain: "coreinworker.firebaseapp.com",
  projectId: "coreinworker",
  storageBucket: "coreinworker.firebasestorage.app",
  messagingSenderId: "190696412712",
  appId: "1:190696412712:web:b9d6c9ab1bd770becc871d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
