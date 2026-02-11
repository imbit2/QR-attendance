/* =========================================================
   IMPORT FIREBASE
========================================================= */
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
   doc,
   setDoc,
   deleteDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* =========================================================
   MAIN PAGE LOADER
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
autoDeleteAttendanceToday();
  const filename = window.location.pathname.split("/").pop();

  /* ---------------------------------------------
     1️⃣ LOGIN PROTECTION (runs on all pages except login)
  --------------------------------------------- */
  if (filename !== "login.html") {
    const role = localStorage.getItem("logged_role");

    if (!role) {
      window.location.href = "login.html";
      return;
    }

    enforceAdminPermissions(role);
  }

});
/* =========================================================
   AUTO DELETE YESTERDAY'S attendance_today
========================================================= */
function getLocalDateISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function autoDeleteAttendanceToday() {

  const today = getLocalDateISO();

  const systemRef = doc(db, "system", "cleanup");
  const sysSnap = await getDocs(systemRef);

  let lastCleanup = sysSnap.exists() ? sysSnap.data().lastCleanupDate : null;

  // First-time initialization
  if (!lastCleanup) {
    await setDoc(systemRef, { lastCleanupDate: today });
    return;
  }

  // Already cleaned today → do nothing
  if (lastCleanup === today) return;

  // Cleanup yesterday’s document
  try {
    const oldRef = doc(db, "attendance_today", lastCleanup);
    await deleteDoc(oldRef);
    console.log("✔ Deleted old attendance_today:", lastCleanup);
  } catch (e) {
    console.error("❌ Delete failed:", e);
  }

  // Update cleanup date
  await setDoc(systemRef, { lastCleanupDate: today });
}
/* =========================================================
   EXPORT STUDENTS (FIREBASE VERSION)
========================================================= */
export async function exportStudentsToExcel() {

  const snap = await getDocs(collection(db, "students"));
  const students = [];

  snap.forEach(doc => {
    students.push({ id: doc.id, ...doc.data() });
  });

  if (students.length === 0) {
    alert("No student data found in database!");
    return;
  }

  // CSV header
  let csv = "Student ID,Name,Guardian,Date of Birth,Address,Belt,Phone,Gender\n";

  // Add rows
  students.forEach(s => {
    csv += `"${s.id || ""}","${s.name || ""}","${s.guardian || ""}","${s.dob || ""}",
            "${s.address || ""}","${s.belt || ""}","${s.phone || ""}","${s.gender || ""}"\n`;
  });

  // Create downloadable CSV file
  let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "Student_Master_Data.csv";
  a.click();

  URL.revokeObjectURL(url);

  alert("CSV exported successfully!");
}

/* =========================================================
   LOGIN / ROLE SYSTEM
========================================================= */
function enforceAdminPermissions(role) {
  if (role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = "none";
    });
  }
}

/* =========================================================
   ADMIN-ONLY FUNCTION GUARD
========================================================= */
export function adminOnly() {
  const role = localStorage.getItem("logged_role");

  if (role !== "admin") {
    alert("Only admin can perform this action.");
    throw new Error("Unauthorized action by coach.");
  }
}

window.loadHeader = function () {
  fetch("header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("header").innerHTML = html;
    });
};

/* =========================================================
   LOGOUT FUNCTION
========================================================= */
window.logout = function () {
  localStorage.removeItem("logged_role");
  localStorage.removeItem("loginTime");

  alert("You have been logged out.");
  window.location.href = "login.html";
};

/* =========================================================
   HELPER: TODAY DATE (used in attendance pages)
========================================================= */
export function today() {
  return new Date().toLocaleDateString("en-CA");
}

/* =========================================================
   SAFARI BACK-CACHE FIX
========================================================= */
window.addEventListener("pageshow", event => {
  if (event.persisted) window.location.reload();
});



