import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

/* ============================================================
   LOAD STUDENTS
============================================================ */
async function getStudents() {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/* ============================================================
   GET ATTENDANCE FOR MONTH
============================================================ */
async function getAttendance(year, month, studentId) {
  const ref = doc(db, "attendance", year.toString(), month, studentId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().days : 0;
}

/* ============================================================
   POPULATE MONTH SELECT DROPDOWN
============================================================ */
function populateMonthDropdown() {
  const select = document.getElementById("monthSelect");

  months.forEach((m, i) => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = m;

    // auto-select current month
    if (i === new Date().getMonth()) option.selected = true;

    select.appendChild(option);
  });
}

/* ============================================================
   LOAD SUMMARY TABLE
============================================================ */
async function loadSummary() {
  const tbody = document.getElementById("summaryBody");
  tbody.innerHTML = "";

  const year = new Date().getFullYear().toString();
  const selectedMonth = document.getElementById("monthSelect").value;

  const students = await getStudents();

  for (let student of students) {
    const days = await getAttendance(year, selectedMonth, student.id);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${days}</td>
    `;
    tbody.appendChild(row);
  }
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

  let csv = rows.map(e => e.join(",")).join("\n");
  let blob = new Blob([csv], { type: "text/csv" });

  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Monthly-Summary.csv";
  link.click();
}

/* ============================================================
   INITIALIZE PAGE
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  populateMonthDropdown();
  await loadSummary();
});

/* Change month listener */
document.getElementById("monthSelect").addEventListener("change", () => {
  loadSummary();
});

/* Export CSV */
document.getElementById("exportBtn").addEventListener("click", exportReport);