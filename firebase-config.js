// firebase-config.js — Junto Firebase konfiguracija
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

// Nastavi trajni login (ostane prijavljen tudi po zaprtju brskalnika)
setPersistence(auth, browserLocalPersistence);

// ── Auth ──────────────────────────────────────────────────────
async function loginWithGoogle() {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    console.error("Login napaka:", e);
    return null;
  }
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

// ── Chat ─────────────────────────────────────────────────────
async function sendChatMessage(activityId, text) {
  const user = auth.currentUser;
  if (!user || !text.trim()) throw new Error("Ni sporočila ali prijave");
  
  return await addDoc(collection(db, "aktivnosti", activityId, "chat"), {
    text: text.trim(),
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
  });
}

async function deleteChatMessage(activityId, messageId) {
  const user = auth.currentUser;
  if (!user) return;
  await deleteDoc(doc(db, "aktivnosti", activityId, "chat", messageId));
}

function listenChat(activityId, callback) {
  const q = query(
    collection(db, "aktivnosti", activityId, "chat"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

async function setTyping(activityId, isTyping) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await setDoc(doc(db, "aktivnosti", activityId, "typing", user.uid), {
      displayName: user.displayName,
      isTyping,
      updatedAt: serverTimestamp(),
    });
  } catch(e) {}
}

function listenTyping(activityId, callback) {
  return onSnapshot(collection(db, "aktivnosti", activityId, "typing"), snap => {
    const typingUsers = snap.docs
      .filter(d => d.data().isTyping && d.id !== auth.currentUser?.uid)
      .map(d => d.data().displayName);
    callback(typingUsers);
  });
}

export {
  db, storage, auth,
  loginWithGoogle, logout, getCurrentUser, onAuth,
  objavljiAktivnost, getAktivnosti, listenAktivnosti,
  sendChatMessage, deleteChatMessage, listenChat, setTyping, listenTyping
};
