import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADgEL0zawmR2qlUWTq3r2ZNJVSxFCwA4M",
  authDomain: "login-form-122cb.firebaseapp.com",
  projectId: "login-form-122cb",
  storageBucket: "login-form-122cb.firebasestorage.app",
  messagingSenderId: "192959769573",
  appId: "1:192959769573:web:83ac0ae380777aea611d0c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
