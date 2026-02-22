import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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
async function getAttendance(year, month, studentId) {
  // month is already "YYYY-MM"
  const monthStr = month;   // example: "2026-02"

  const snap = await getDocs(collection(db, "attendance"));

  let presentCount = 0;

  snap.forEach(docSnap => {
    const docId = docSnap.id; // format YYYY-MM-DD

    // Check if document is inside the selected month
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
   LOAD SUMMARY TABLE
============================================================ */
async function loadSummary() {
  const tbody = document.getElementById("summaryBody");
  tbody.innerHTML = "";

  const monthInput = document.getElementById("monthSelect").value;
  if (!monthInput) return; // No month selected yet

  const [year, month] = monthInput.split("-");
  const students = await getStudents();

  for (let student of students) {
    const days = await getAttendance(year, `${year}-${month}`, student.id);

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
document.addEventListener("DOMContentLoaded", () => {
  // Auto-select current month in input[type=month]
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  document.getElementById("monthSelect").value = `${year}-${month}`;

  loadSummary();
});

/* Change month listener */
document.getElementById("monthSelect").addEventListener("change", loadSummary);

/* Export CSV */
document.getElementById("exportBtn").addEventListener("click", exportReport);
