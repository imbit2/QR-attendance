import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* ============================================================
   GLOBALS
============================================================ */
const rowsPerPage = 10;
let allStudents = [];
let currentPage = 1;

let selectedYear = "";
let selectedMonthStr = "";

let monthInputValue = "";
let monthlyAttendanceCache = {}; // ✅ cache attendance only once

/* ============================================================
   LOAD STUDENTS
============================================================ */
async function getStudents() {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/* ============================================================
   LOAD ATTENDANCE ONLY ONCE FOR SELECTED MONTH
============================================================ */
async function loadAttendanceForMonth(monthStr) {
  const snap = await getDocs(collection(db, "attendance"));
  
  monthlyAttendanceCache = {}; // clear old cache
  const dailyRecords = snap.docs;

  for (let docSnap of dailyRecords) {
    const docId = docSnap.id; // YYYY-MM-DD

    if (docId.startsWith(monthStr)) {
      const dayData = docSnap.data();

      // Store for quick lookup
      monthlyAttendanceCache[docId] = dayData;
    }
  }
}

/* ============================================================
   FAST ATTENDANCE COUNT USING CACHED DATA
============================================================ */
function getAttendance(studentId) {
  let present = 0;

  for (let day in monthlyAttendanceCache) {
    const rec = monthlyAttendanceCache[day];

    if (rec[studentId] && rec[studentId].status === "Present") {
      present++;
    }
  }

  return present;
}

/* ============================================================
   LOAD PAGE
============================================================ */
async function loadPage(pageNum) {
  currentPage = pageNum;

  const tbody = document.getElementById("summaryBody");
  tbody.innerHTML = "";

  const start = (pageNum - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const pageStudents = allStudents.slice(start, end);

  for (let student of pageStudents) {
    const days = getAttendance(student.id);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${days}</td>
    `;
    tbody.appendChild(row);
  }

  renderPagination();
}

/* ============================================================
   ADVANCED PAGINATION
============================================================ */
function renderPagination() {
  const container = document.getElementById("paginationContainer");
  container.innerHTML = "";

  const totalPages = Math.ceil(allStudents.length / rowsPerPage);
  if (totalPages <= 1) return;

  function addButton(text, disabled, click) {
    let btn = document.createElement("button");
    btn.textContent = text;
    if (disabled) btn.classList.add("disabled");
    btn.onclick = click;
    container.appendChild(btn);
  }

  addButton("<<", currentPage === 1, () => loadPage(currentPage - 1));

  let maxPages = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPages - 1);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  if (startPage > 1) {
    addPage(1);
    if (startPage > 2) addEllipsis();
  }

  for (let i = startPage; i <= endPage; i++) addPage(i);

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) addEllipsis();
    addPage(totalPages);
  }

  addButton(">>", currentPage === totalPages, () => loadPage(currentPage + 1));

  function addPage(i) {
    let btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === currentPage) ? "active-page" : "";
    btn.onclick = () => loadPage(i);
    container.appendChild(btn);
  }

  function addEllipsis() {
    let el = document.createElement("button");
    el.textContent = "...";
    el.className = "disabled";
    container.appendChild(el);
  }
}

/* ============================================================
   LOAD SUMMARY
============================================================ */
async function loadSummary() {
  monthInputValue = document.getElementById("monthSelect").value;
  if (!monthInputValue) return;

  const [year, month] = monthInputValue.split("-");
  selectedYear = year;
  selectedMonthStr = `${year}-${month}`;

  // Load students once
  allStudents = await getStudents();

  // Load attendance ONCE for entire month (FAST)
  await loadAttendanceForMonth(selectedMonthStr);

  // Load page 1
  loadPage(1);
}

/* ============================================================
   EXPORT CSV (FAST)
============================================================ */
async function exportReport() {
  let rows = [["Student ID", "Name", "Attendance Days"]];

  for (let student of allStudents) {
    const days = getAttendance(student.id);
    rows.push([student.id, student.name, days]);
  }

  const csv = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Monthly-Summary-${selectedMonthStr}.csv`;
  link.click();
}

/* ============================================================
   INITIALIZE
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  document.getElementById("monthSelect").value = `${year}-${month}`;

  loadSummary();
});

document.getElementById("monthSelect").addEventListener("change", loadSummary);
document.getElementById("exportBtn").addEventListener("click", exportReport);
