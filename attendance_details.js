import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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
  const students = [];
  studentsSnap.forEach(doc => students.push({ id: doc.id, ...doc.data() }));

  // Load attendance for selected date
  const attendanceRef = doc(db, "attendance", date);
  const attendanceSnap = await getDoc(attendanceRef);
  const dayData = attendanceSnap.exists() ? attendanceSnap.data() : {};

  // Build table rows
  students.forEach(student => {
    const record = dayData[student.id] || null;

    const inTime = record?.inTime || "-";
    const outTime = record?.outTime || "-";
    const status = record?.status || "Absent";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name || "-"}</td>
      <td>${inTime}</td>
      <td>${outTime}</td>
      <td>${status}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ==========================
// EXPORT CSV
// ==========================
async function exportExcel() {
  const date = document.getElementById("attendanceDate").value;

  const studentsSnap = await getDocs(collection(db, "students"));
  const students = [];
  studentsSnap.forEach(doc => students.push({ id: doc.id, ...doc.data() }));

  const attendanceRef = doc(db, "attendance", date);
  const attendanceSnap = await getDoc(attendanceRef);
  const dayData = attendanceSnap.exists() ? attendanceSnap.data() : {};

  let csv = "ID,Name,IN,OUT,Status\n";

  students.forEach(student => {
    const record = dayData[student.id] || null;

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
