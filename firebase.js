import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCz6-QK_ZYdPwcb3s_IRl_h59pHhw8TByk",
  authDomain: "bmo-45fdc.firebaseapp.com",
  projectId: "bmo-45fdc",
  storageBucket: "bmo-45fdc.firebasestorage.app",
  messagingSenderId: "382426348718",
  appId: "1:382426348718:web:64d69063162073ca71813f",
  measurementId: "G-0H21SP724L"
};

export const STORAGE_BUCKET_CANDIDATES = [
  "gs://bmo-45fdc.firebasestorage.app",
  "gs://bmo-45fdc.appspot.com"
];

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, STORAGE_BUCKET_CANDIDATES[0]);
