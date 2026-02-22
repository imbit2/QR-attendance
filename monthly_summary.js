import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* ============================================================
   GLOBALS
============================================================ */
const ITEMS_PER_PAGE = 10;
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

  const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
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
   RENDER PAGINATION BUTTONS
============================================================ */
function renderPagination() {
  const container = document.getElementById("paginationContainer");
  container.innerHTML = "";

  const totalPages = Math.ceil(allStudents.length / ITEMS_PER_PAGE);

  if (totalPages <= 1) return; // Nothing to paginate

  // Prev button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => loadPage(currentPage - 1);
  container.appendChild(prevBtn);

  // Page number buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === currentPage) ? "active" : "";
    btn.onclick = () => loadPage(i);
    container.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => loadPage(currentPage + 1);
  container.appendChild(nextBtn);
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

  // Fetch all students once
  allStudents = await getStudents();

  // Load first page
  loadPage(1);
}

/* ============================================================
   EXPORT TABLE TO CSV
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
   INITIALIZE PAGE
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  document.getElementById("monthSelect").value = `${year}-${month}`;

  loadSummary();
});

// Change month listener
document.getElementById("monthSelect").addEventListener("change", loadSummary);

// Export CSV
document.getElementById("exportBtn").addEventListener("click", exportReport);
