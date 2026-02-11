// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyAOMIc-0eaRd6OB-khaSm_nE2SVOTXJHMU",
    authDomain: "attendance-11b46.firebaseapp.com",
    projectId: "attendance-11b46",
    storageBucket: "attendance-11b46.firebasestorage.app",
    messagingSenderId: "28807163024",
    appId: "1:28807163024:web:8e617ff20d8c8f2a4ebc15"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

