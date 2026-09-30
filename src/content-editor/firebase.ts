import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Public browser configuration; access is enforced by Firebase rules.
const app = initializeApp({
  "apiKey": "AIzaSyA_kDSvCaQMtEfCkEOqGXHli0gVykEtZOo",
  "authDomain": "treefilm-eb71e.firebaseapp.com",
  "projectId": "treefilm-eb71e",
  "appId": "1:974417726858:web:c468a1b4e590e0df454c73",
  "messagingSenderId": "974417726858"
});
export const auth = getAuth(app);
export const db = getFirestore(app);
