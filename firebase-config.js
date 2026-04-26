// firebase-config.js — Junto Firebase konfiguracija
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCS5io8l-qFIMEV11-2DJvScB5TaoFLbZI",
  authDomain: "juntofb.firebaseapp.com",
  projectId: "juntofb",
  storageBucket: "juntofb.firebasestorage.app",
  messagingSenderId: "37339064053",
  appId: "1:37339064053:web:707ce0254617998e8d87bc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ── Auth ──────────────────────────────────────────────────────
async function loginWithGoogle() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    await signInWithRedirect(auth, provider);
    return null; // stran se bo osvežila po redirectu
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    console.error("Login napaka:", e);
    return null;
  }
}

async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch(e) { return null; }
}

function logout() {
  return signOut(auth);
}

function getCurrentUser() {
  return auth.currentUser;
}

function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Aktivnosti ────────────────────────────────────────────────
async function objavljiAktivnost(data, photoFile) {
  const user = auth.currentUser;
  if (!user) throw new Error("Nisi prijavljen");

  let photoURL = null;
  if (photoFile) {
    const storageRef = ref(storage, `aktivnosti/${Date.now()}_${photoFile.name}`);
    await uploadBytes(storageRef, photoFile);
    photoURL = await getDownloadURL(storageRef);
  }

  const doc = await addDoc(collection(db, "aktivnosti"), {
    ...data,
    photoURL,
    organizerId: user.uid,
    organizerName: user.displayName,
    organizerPhoto: user.photoURL,
    createdAt: serverTimestamp(),
    udelezenci: [user.uid],
    udelezenecIme: [user.displayName],
  });

  return doc.id;
}

async function getAktivnosti() {
  const q = query(collection(db, "aktivnosti"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function listenAktivnosti(callback) {
  const q = query(collection(db, "aktivnosti"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export {
  db, storage, auth,
  loginWithGoogle, checkRedirectResult, logout, getCurrentUser, onAuth,
  objavljiAktivnost, getAktivnosti, listenAktivnosti
};
