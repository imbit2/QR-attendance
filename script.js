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

// Pagination Variables
let currentPage = 1;
let rowsPerPage = 10;
let currentStudents = [];
let currentDayData = {};

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

// ==========================
// PAGINATION
// ==========================
function renderPagination() {
  const totalPages = Math.ceil(currentStudents.length / rowsPerPage);
  const container = document.getElementById("paginationContainer");
  container.innerHTML = "";

  if (totalPages <= 1) return;

  // --- If pages are 5 or fewer, show simple pagination ---
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = "pagination-btn";
      if (i === currentPage) btn.classList.add("active");

      btn.addEventListener("click", () => {
        currentPage = i;
        renderTable();
        renderPagination();
      });

      container.appendChild(btn);
    }
    return;
  }

  // --- Chunk Pagination Logic (5 per group) ---
  const chunkSize = 5;
  const currentChunk = Math.floor((currentPage - 1) / chunkSize);
  const startPage = currentChunk * chunkSize + 1;
  const endPage = Math.min(startPage + chunkSize - 1, totalPages);

  // --- Previous Chunk Button (<) ---
  if (startPage > 1) {
    const prevChunkBtn = document.createElement("button");
    prevChunkBtn.textContent = "<";
    prevChunkBtn.className = "pagination-btn";

    prevChunkBtn.addEventListener("click", () => {
      currentPage = startPage - 1;
      renderTable();
      renderPagination();
    });

    container.appendChild(prevChunkBtn);
  }

  // --- Page Buttons in Current Chunk ---
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "pagination-btn";
    if (i === currentPage) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentPage = i;
      renderTable();
      renderPagination();
    });

    container.appendChild(btn);
  }

  // --- Next Chunk Button (>) ---
  if (endPage < totalPages) {
    const nextChunkBtn = document.createElement("button");
    nextChunkBtn.textContent = ">";
    nextChunkBtn.className = "pagination-btn";

    nextChunkBtn.addEventListener("click", () => {
      currentPage = endPage + 1;
      renderTable();
      renderPagination();
    });

    container.appendChild(nextChunkBtn);
  }
}

/* =========================================================
   SAFARI BACK-CACHE FIX
========================================================= */
window.addEventListener("pageshow", event => {
  if (event.persisted) window.location.reload();
});

