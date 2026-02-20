import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* =====================================================
   FETCH STUDENTS (IMPORTANT FIX)
===================================================== */
async function getStudents() {
  const snapshot = await getDocs(collection(db, "students"));
  return snapshot.docs.map(d => ({
    id: d.id,      // ✔ FIXED — include document ID
    ...d.data()
  }));
}

/* =====================================================
   FETCH FEES FOR YEAR
===================================================== */
async function getFeesForYear(year) {
  const ref = collection(db, "fees", year, "students");
  const snapshot = await getDocs(ref);

  let data = {};
  snapshot.forEach(d => {
    data[d.id] = d.data();
  });

  return data;
}

/* =====================================================
   SAVE / UPDATE STUDENT FEES
===================================================== */
async function saveStudentFees(year, studentId, data) {
  if (!studentId || !year) {
    console.error("❌ Invalid Firestore Path:", { year, studentId });
    return;
  }

  await setDoc(
    doc(db, "fees", year.toString(), "students", studentId.toString()),
    data,
    { merge: true }
  );
}

/* =====================================================
   MONTHS
===================================================== */
const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

/* =====================================================
   ON PAGE LOAD
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadYearDropdown();
  loadStudentTable();
});

/* =====================================================
   YEAR DROPDOWN
===================================================== */
async function loadYearDropdown() {
  let dropdown = document.getElementById("yearDropdown");
  let currentYear = new Date().getFullYear().toString();

  dropdown.innerHTML = "";

  let option = document.createElement("option");
  option.value = currentYear;
  option.textContent = currentYear;
  dropdown.appendChild(option);

  dropdown.value = currentYear;

  dropdown.addEventListener("change", () => loadStudentTable());
}

/* =====================================================
   LOAD STUDENT TABLE
===================================================== */
async function loadStudentTable() {
  let tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  let students = await getStudents();
  let year = document.getElementById("yearDropdown").value;

  if (!year) year = new Date().getFullYear().toString(); // ✔ safer

  let fees = await getFeesForYear(year);

  for (let stu of students) {
    if (!stu.name || !stu.id) continue;

    // If fee record missing — create it
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

/* =====================================================
   PAYMENT PAGE LINK
===================================================== */
window.openFeePayment = function (studentId) {
  localStorage.setItem("feeSelectedStudent", studentId);
};

/* =====================================================
   EXPORT EXCEL (CSV)
===================================================== */
window.exportFeesExcel = async function () {
  let year = document.getElementById("yearDropdown").value;
  if (!year) year = new Date().getFullYear().toString();

  let fees = await getFeesForYear(year);
  let students = await getStudents();

  let rows = [];

  rows.push([
    "Student ID", "Name",
    "Jan","Feb","Mar","Apr","May",
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

  // Convert to CSV
  let csv = rows.map(r => r.join(",")).join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = `Fees_${year}.csv`;
  a.click();
};
