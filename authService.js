import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function observeAuthenticatedUser(onAuthenticated, onUnauthenticated) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onUnauthenticated?.();
      return;
    }

    onAuthenticated(user);
  });
}

export async function getUserProfile(userId) {
  const userRef = doc(db, "usuarios", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data();
}
