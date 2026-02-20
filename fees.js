import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// =========================
// Fetch all students
// =========================
async function getStudents() {
  const snapshot = await getDocs(collection(db, "students"));
  return snapshot.docs.map(d => d.data());
}

// =========================
// Fetch fees for a year
// =========================
async function getFeesForYear(year) {
  const ref = collection(db, "fees", year, "students");
  const snapshot = await getDocs(ref);

  let data = {};
  snapshot.forEach(d => {
    data[d.id] = d.data();
  });

  return data;
}

// =========================
// Save student fees
// =========================
async function saveStudentFees(year, studentId, data) {
  await setDoc(
    doc(db, "fees", year, "students", studentId),
    data,
    { merge: true }
  );
}

// =========================
// MONTHS
// =========================
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// =========================
// ON LOAD
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadYearDropdown();
  loadStudentTable();
});

// =========================
// YEAR DROPDOWN
// =========================
async function loadYearDropdown() {
  let dropdown = document.getElementById("yearDropdown");
  let currentYear = new Date().getFullYear();

  dropdown.innerHTML = "";

  let opt = document.createElement("option");
  opt.value = currentYear;
  opt.textContent = currentYear;
  dropdown.appendChild(opt);

  dropdown.value = currentYear;

  dropdown.addEventListener("change", () => loadStudentTable());
}

// =========================
// STUDENT TABLE
// =========================
async function loadStudentTable() {
  let tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  let students = await getStudents();
  let year = document.getElementById("yearDropdown").value;
  let fees = await getFeesForYear(year);

  for (let stu of students) {
    if (!stu.name.trim()) continue;

    // create default fee record if missing
    if (!fees[stu.id]) {
      let defaultData = {};
      months.forEach(m => defaultData[m] = "Due");

      await saveStudentFees(year, stu.id, defaultData);
      fees[stu.id] = defaultData;
    }

    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stu.id}</td>
      <td>${stu.name}</td>
      <td>
        <a href="fee_payment.html"
           onclick="openFeePayment('${stu.id}')">
           Manage
        </a>
      </td>
    `;

    tbody.appendChild(tr);
  }
}

// =========================
// PAYMENT PAGE LINK
// =========================
function openFeePayment(studentId) {
  localStorage.setItem("feeSelectedStudent", studentId);
}

// =========================
// EXCEL EXPORT
// =========================
async function exportFeesExcel() {
  let year = document.getElementById("yearDropdown").value;
  let fees = await getFeesForYear(year);
  let students = await getStudents();

  let rows = [];

  rows.push([
    "Student ID","Name","Jan","Feb","Mar","Apr","May",
    "Jun","Jul","Aug","Sep","Oct","Nov","Dec"
  ]);

  students.forEach(stu => {
    if (!stu.name.trim()) return;

    let row = [stu.id, stu.name];

    months.forEach(m => {
      let status = fees[stu.id]?.[m] || "Due";
      row.push(status);
    });

    rows.push(row);
  });

  // Convert → CSV
  let csv = rows.map(r => r.join(",")).join("\n");

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = `Fees_${year}.csv`;
  a.click();
}