/* =========================================================
   IMPORT FIREBASE
========================================================= */
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
   getDoc,
   doc,
   setDoc,
   deleteDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* =========================================================
   MAIN PAGE LOADER
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  autoDeleteAttendanceToday();
  checkAutoLogout();  // <--- ADD THIS LINE

  const filename = window.location.pathname.split("/").pop();

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
   AUTO LOGOUT AFTER 8 HOURS
========================================================= */
function checkAutoLogout() {
  const loginTime = localStorage.getItem("loginTime");

  // Not logged in → nothing to check
  if (!loginTime) return;

  const now = Date.now();
  const maxSession = 8 * 60 * 60 * 1000;  // 8 hours in ms

  if (now - Number(loginTime) > maxSession) {
    // Session expired → force logout
    localStorage.removeItem("logged_role");
    localStorage.removeItem("loginTime");

    alert("Your session expired. You have been logged out automatically.");
    window.location.href = "login.html";
  }
}
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
  const sysSnap = await getDoc(systemRef);

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
window.exportStudentsToExcel = async function () {

  const snap = await getDocs(collection(db, "students"));
  const students = [];

  snap.forEach(docSnap => {
    students.push({ id: docSnap.id, ...docSnap.data() });
  });

  if (students.length === 0) {
    alert("No student data found!");
    return;
  }

  // ✅ Sort (optional)
  students.sort((a, b) => a.id.localeCompare(b.id));

  // ✅ Prepare data for Excel
  const excelData = students.map(s => ({
    "Student ID": s.id || "",
    "Name": s.name || "",
    "Guardian": s.guardian || "",
    "Date of Birth": s.dob || "",
    "Address": s.address || "",
    "Belt": s.belt || "",
    "Phone": s.phone || "",
    "Gender": s.gender || ""
  }));

  // ✅ Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // ✅ Auto column width
  const colWidths = [
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 10 },
    { wch: 15 },
    { wch: 10 }
  ];
  ws["!cols"] = colWidths;

  // ✅ Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  // ✅ File name with date
  const today = new Date().toISOString().split("T")[0];
  const fileName = `Student_Master_${today}.xlsx`;

  // ✅ Export
  XLSX.writeFile(wb, fileName);

  alert("✅ Excel file downloaded!");
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




