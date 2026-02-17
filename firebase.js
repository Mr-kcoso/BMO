import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsYcXHWa0S6g9FbUKpDbxE2jvuQ-YB5Ko",
  authDomain: "bmo-tcc.firebaseapp.com",
  projectId: "bmo-tcc",
  storageBucket: "bmo-tcc.appspot.com",
  messagingSenderId: "808332187636",
  appId: "1:808332187636:web:116a40a291ee53d73acba1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, "gs://bmo-tcc.appspot.com");
