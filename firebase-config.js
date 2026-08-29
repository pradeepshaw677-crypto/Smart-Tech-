
// firebase-config.js

// Firebase SDKs import karna
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"; // Login/Registration ke liye

// Aapka Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCJ9vr7y4_4tbQ4TtEc_D9AxaBqL4XqjiE",
    authDomain: "smart-tech-d6528.firebaseapp.com",
    projectId: "smart-tech-d6528",
    storageBucket: "smart-tech-d6528.firebasestorage.app",
    messagingSenderId: "609442300839",
    appId: "1:609442300839:web:4b49a90937f05a01042c82",
    measurementId: "G-YSV2PD1MNV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Authentication service initialize karna

// Inko export karna zaroori hai taaki dusri files (HTML/JS) inko import kar sakein
export { app, analytics, auth };
