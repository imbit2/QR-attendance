// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAOMIc-0eaRd6OB-khaSm_nE2SVOTXJHMU",
  authDomain: "attendance-11b46.firebaseapp.com",
  projectId: "attendance-11b46",
  storageBucket: "attendance-11b46.firebasestorage.app",
  messagingSenderId: "28807163024",
  appId: "1:28807163024:web:8e617ff20d8c8f2a4ebc15"
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📅 Today (YYYY-MM-DD)
const today = new Date().toLocaleDateString("en-CA");

// ✅ Mark attendance function
export async function markAttendance(studentId) {
  const attendanceId = `${studentId}_${today}`;
  const ref = doc(db, "attendance", attendanceId);
  const msg = document.getElementById("msg");

  const snap = await getDoc(ref);

  if (snap.exists()) {
    msg.innerText = "⚠️ Attendance already marked";
  } else {
    await setDoc(ref, {
      studentId: studentId,
      date: today,
      time: new Date().toLocaleTimeString("en-IN"),
      status: "Present"
    });

    msg.innerText = "✅ Attendance marked for " + studentId;
  }
}
