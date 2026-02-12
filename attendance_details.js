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


