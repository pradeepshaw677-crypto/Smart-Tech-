// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    getFirestore, 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase configuration for Smart Tech
const firebaseConfig = {
    apiKey: "AIzaSyCJ9vr7y4_4tbQ4TtEc_D9AxaBqL4XqjiE",
    authDomain: "smart-tech-d6528.firebaseapp.com",
    projectId: "smart-tech-d6528",
    storageBucket: "smart-tech-d6528.firebasestorage.app",
    messagingSenderId: "609442300839",
    appId: "1:609442300839:web:4b49a90937f05a01042c82",
    measurementId: "G-YSV2PD1MNV"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Analytics safely
let analytics = null;
try {
    analytics = getAnalytics(app);
} catch (e) {
    // Analytics may be ignored in restricted or offline contexts
}

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore with multi-tab offline persistence for instant loading and quota saving
let db;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
} catch (e) {
    db = getFirestore(app);
}

// Global safe error logger
export function handleFirestoreError(error, context = '') {
    console.warn(`[Smart Tech Security - ${context}]:`, error?.message || error);
}

export { app, analytics, auth, db, firebaseConfig };
