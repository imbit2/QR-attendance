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

/* ============================================================
   LOAD STUDENTS
============================================================ */
async function getStudents() {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/* ============================================================
   GET ATTENDANCE FOR SELECTED MONTH
============================================================ */
async function getAttendance(year, monthStr, studentId) {
  const attendanceSnap = await getDocs(collection(db, "attendance"));

  let presentCount = 0;

  attendanceSnap.forEach(docSnap => {
    const docId = docSnap.id; // YYYY-MM-DD

    if (docId.startsWith(monthStr)) {
      const data = docSnap.data();
      if (data[studentId] && data[studentId].status === "Present") {
        presentCount++;
      }
    }
  });

  return presentCount;
}

/* ============================================================
   LOAD TABLE PAGE DATA
============================================================ */
async function loadPage(pageNumber) {
  currentPage = pageNumber;

  const tbody = document.getElementById("summaryBody");
  tbody.innerHTML = "";

  const startIndex = (pageNumber - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageStudents = allStudents.slice(startIndex, endIndex);

  for (let student of pageStudents) {
    const days = await getAttendance(selectedYear, selectedMonthStr, student.id);

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
   ADVANCED PAGINATION (MATCHES YOUR PROVIDED FUNCTION)
============================================================ */
function renderPagination() {
  const container = document.getElementById("paginationContainer");
  container.innerHTML = "";

  const filteredStudents = allStudents;
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  if (totalPages <= 1) return;

  /* ---- PREVIOUS BUTTON ---- */
  let prevBtn = document.createElement("button");
  prevBtn.textContent = "<<";
  prevBtn.className = currentPage === 1 ? "disabled" : "";
  prevBtn.onclick = () => {
    if (currentPage > 1) loadPage(currentPage - 1);
  };
  container.appendChild(prevBtn);

  /* ---- PAGE RANGE LOGIC ---- */
  let maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  /* ---- FIRST PAGE + "..." ---- */
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) addEllipsis();
  }

  /* ---- MIDDLE PAGES ---- */
  for (let i = startPage; i <= endPage; i++) addPageButton(i);

  /* ---- LAST PAGE + "..." ---- */
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) addEllipsis();
    addPageButton(totalPages);
  }

  /* ---- NEXT BUTTON ---- */
  let nextBtn = document.createElement("button");
  nextBtn.textContent = ">>";
  nextBtn.className = currentPage === totalPages ? "disabled" : "";
  nextBtn.onclick = () => {
    if (currentPage < totalPages) loadPage(currentPage + 1);
  };
  container.appendChild(nextBtn);

  /* Utility functions */
  function addPageButton(i) {
    let btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === currentPage) ? "active-page" : "";
    btn.onclick = () => loadPage(i);
    container.appendChild(btn);
  }

  function addEllipsis() {
    let span = document.createElement("button");
    span.textContent = "...";
    span.className = "disabled";
    span.style.cursor = "default";
    container.appendChild(span);
  }
}

/* ============================================================
   LOAD SUMMARY (FETCH STUDENTS + RESET PAGINATION)
============================================================ */
async function loadSummary() {
  monthInputValue = document.getElementById("monthSelect").value;
  if (!monthInputValue) return;

  const [year, month] = monthInputValue.split("-");
  selectedYear = year;
  selectedMonthStr = `${year}-${month}`;

  allStudents = await getStudents();

  loadPage(1);
}

/* ============================================================
   EXPORT TO CSV
============================================================ */
function exportReport() {
  let rows = [["Student ID", "Name", "Attendance Days"]];

  const trs = document.querySelectorAll("#summaryBody tr");

  trs.forEach(tr => {
    const cols = [...tr.children].map(td => td.textContent);
    rows.push(cols);
  });

  const csv = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Monthly-Summary.csv";
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
