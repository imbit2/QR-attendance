/* =========================================================
   FIREBASE IMPORTS
========================================================= */
import { db } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* =========================================================
   GLOBALS
========================================================= */
let html5QrCode;
let scanStarted = false;

const today = new Date().toLocaleDateString("en-CA");

let studentsCache = [];

/* =========================================================
   ON PAGE LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadStudents();
  await resetAttendanceToday();
});

/* =========================================================
   LOAD STUDENTS FROM FIRESTORE
========================================================= */
async function loadStudents() {
  const snap = await getDocs(collection(db, "students"));
  studentsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* =========================================================
   RESET TODAY’S ATTENDANCE IN FIRESTORE
========================================================= */
async function resetAttendanceToday() {
  const ref = doc(db, "attendance_today", today);
  const snap = await getDoc(ref);

  if (snap.exists()) return; // Already initialized

  // Create EMPTY structure for today
  let data = {};

  studentsCache.forEach(s => {
    if (!s.name || s.name.trim() === "") return;

    data[s.id] = {
      scans: [],
      status: "Absent",
      inTime: "",
      outTime: ""
    };
  });

  await setDoc(ref, data);
}

/* =========================================================
   START QR SCAN
========================================================= */
function startScan() {
  if (scanStarted) return;
  scanStarted = true;

  html5QrCode = new Html5Qrcode("qr-reader");

  Html5Qrcode.getCameras()
    .then(devices => {

      if (!devices || devices.length === 0) {
        alert("No camera found");
        scanStarted = false;
        return;
      }

      let backCam = devices.find(cam =>
        cam.label.toLowerCase().includes("back")
      );

      if (!backCam) backCam = devices[devices.length - 1];

      return html5QrCode.start(
        { deviceId: { exact: backCam.id } },
        {
          fps: 25,
          qrbox: 300,
          disableFlip: true,
          videoConstraints: {
            facingMode: { exact: "environment" }
          }
        },
        onScanSuccess,
        () => {}
      );
    })
    .catch(() => {
      scanStarted = false;
      setTimeout(startScan, 1000);
    });
}

/* =========================================================
   SCAN LOCKING
========================================================= */
let scanLocked = false;
function onScanSuccess(id) {
  if (scanLocked) return;
  scanLocked = true;

  handleAttendance(id);

  setTimeout(() => scanLocked = false, 3000);
}

/* =========================================================
   MAIN ATTENDANCE LOGIC (FIRESTORE VERSION)
========================================================= */
async function handleAttendance(studentId) {

  const student = studentsCache.find(s => s.id === studentId);

  if (!student) {
    speak("Invalid ID");
    return;
  }

  const todayRef = doc(db, "attendance_today", today);
  const todaySnap = await getDoc(todayRef);

  let todayData = todaySnap.exists() ? todaySnap.data() : {};

  // Ensure student record exists
  if (!todayData[studentId]) {
    todayData[studentId] = {
      scans: [],
      status: "Absent",
      inTime: "",
      outTime: ""
    };
  }

  const record = todayData[studentId];
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);

  /* --- Already scanned twice --- */
  if (record.scans.length >= 2) {
    speak("Attendance already done");
    return;
  }

  /* --- Second scan (out time) --- */
  if (record.scans.length === 1) {
    const first = record.scans[0];
    const [h, m] = first.split(":").map(Number);

    const firstScan = new Date();  
    firstScan.setHours(h, m, 0);

    const diffMins = (now - firstScan) / 60000;

    if (diffMins < 60) {
      speak("Scan after sixty minutes");
      return;
    }

    record.scans.push(timeStr);
    record.outTime = timeStr;

    await updateDoc(todayRef, { [studentId]: record });
    await saveToPermanentHistory(studentId, record);

    speak("Thank you");
    return;
  }

  /* --- First scan (in time) --- */
  record.scans.push(timeStr);
  record.inTime = timeStr;
  record.status = "Present";

  await updateDoc(todayRef, { [studentId]: record });
  await saveToPermanentHistory(studentId, record);

  speak("Welcome to Playmate");
}

/* =========================================================
   SAVE TO FIRESTORE → attendance (permanent)
========================================================= */
async function saveToPermanentHistory(studentId, record) {
  const historyRef = doc(db, "attendance", today);
  const historySnap = await getDoc(historyRef);

  let historyData = historySnap.exists() ? historySnap.data() : {};

  historyData[studentId] = record;

  await setDoc(historyRef, historyData, { merge: true });
}

/* =========================================================
   SPEAK FUNCTION
========================================================= */
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  speechSynthesis.cancel();
  speechSynthesis.speak(msg);
}

/* Expose startScan globally for button */
window.startScan = startScan;

