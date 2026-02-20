import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Pagination Variables
let currentPage = 1;
let rowsPerPage = 10;
let currentStudents = [];
let currentDayData = {};

// ==========================
// PAGE LOAD
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("attendanceDate");

  const today = new Date().toISOString().split("T")[0];

  dateInput.value = today;
  dateInput.max = today;

  loadAttendance(today);

  dateInput.addEventListener("change", () => {
    currentPage = 1;
    loadAttendance(dateInput.value);
  });
});

// ==========================
// LOAD ATTENDANCE FOR DATE
// ==========================
async function loadAttendance(date) {
  const tableBody = document.getElementById("attendanceTableBody");
  tableBody.innerHTML = "";

  // Load all students
  const studentsSnap = await getDocs(collection(db, "students"));
  currentStudents = [];
  studentsSnap.forEach(doc => currentStudents.push({ id: doc.id, ...doc.data() }));

  // Load attendance for selected date
  const attendanceRef = doc(db, "attendance", date);
  const attendanceSnap = await getDoc(attendanceRef);
  currentDayData = attendanceSnap.exists() ? attendanceSnap.data() : {};

  renderTable();
  renderPagination();
}

// ==========================
// RENDER TABLE WITH COLORS
// ==========================
function renderTable() {
  const tbody = document.getElementById("attendanceTableBody");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const pageStudents = currentStudents.slice(start, end);

  pageStudents.forEach(student => {
    const record = currentDayData[student.id] || null;

    const inTime = record?.inTime || "-";
    const outTime = record?.outTime || "-";
    const status = record?.status || "Absent";

    const row = document.createElement("tr");

    // Apply Green for Present / Red for Absent
    const statusClass = status === "Present"
      ? "status-green"
      : "status-red";

    row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name || "-"}</td>
      <td>${inTime}</td>
      <td>${outTime}</td>
      <td class="${statusClass}">${status}</td>
    `;

    tbody.appendChild(row);
  });
}
/* =====================================================
   CHANGE PAGE (MAIN PAGINATION FN)
===================================================== */
function changePage(page) {
  currentPage = page;
  renderTable();
  renderPagination();
}
// ==========================
// PAGINATION
// ==========================
function renderPagination() {
  const container = document.getElementById("paginationContainer");
  container.innerHTML = "";

  const totalPages = Math.ceil(currentStudents.length / rowsPerPage);
  if (totalPages <= 1) return;

  /* ---- PREVIOUS BUTTON ---- */
  let prevBtn = document.createElement("button");
  prevBtn.textContent = "<<";
  prevBtn.className = currentPage === 1 ? "disabled" : "";
  prevBtn.onclick = () => {
    if (currentPage > 1) changePage(currentPage - 1);
  };
  container.appendChild(prevBtn);

  /* ---- PAGE RANGE ---- */
  let maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  /* ---- FIRST PAGE + ... ---- */
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) addEllipsis();
  }

  /* ---- MIDDLE BUTTONS ---- */
  for (let i = startPage; i <= endPage; i++) addPageButton(i);

  /* ---- LAST PAGE + ... ---- */
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) addEllipsis();
    addPageButton(totalPages);
  }

  /* ---- NEXT BUTTON ---- */
  let nextBtn = document.createElement("button");
  nextBtn.textContent = ">>";
  nextBtn.className = currentPage === totalPages ? "disabled" : "";
  nextBtn.onclick = () => {
    if (currentPage < totalPages) changePage(currentPage + 1);
  };
  container.appendChild(nextBtn);

  function addPageButton(i) {
    let btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === currentPage) ? "active-page" : "";
    btn.onclick = () => changePage(i);
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
// ==========================
// EXPORT CSV
// ==========================
async function exportExcel() {
  const date = document.getElementById("attendanceDate").value;

  let csv = "ID,Name,IN,OUT,Status\n";

  currentStudents.forEach(student => {
    const record = currentDayData[student.id] || null;

    const inTime = record?.inTime || "-";
    const outTime = record?.outTime || "-";
    const status = record?.status || "Absent";

    csv += `${student.id},${student.name || ""},${inTime},${outTime},${status}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Attendance_${date}.csv`;
  link.click();
}

window.exportExcel = exportExcel;
