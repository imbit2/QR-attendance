import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ============================================================
   FETCH STUDENT LIST FROM FIRESTORE
============================================================ */
async function getStudents() {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/* ============================================================
   FETCH FEES OF A STUDENT FOR A YEAR
============================================================ */
async function getFees(year, studentId) {
  const ref = doc(db, "fees", year.toString(), "students", studentId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/* ============================================================
   SAVE UPDATED FEES
============================================================ */
async function saveFeeStatus(year, studentId, month, value) {
  const ref = doc(db, "fees", year.toString(), "students", studentId);
  await setDoc(ref, { [month]: value }, { merge: true });
}

/* ============================================================
   LOAD PAYMENT PAGE
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadPaymentPage();
});

async function loadPaymentPage() {
  let studentId = localStorage.getItem("feeSelectedStudent");
  if (!studentId) return;

  const students = await getStudents();
  const student = students.find(s => s.id == studentId);

  const year = new Date().getFullYear().toString();
  let fees = await getFees(year, studentId);

  // Auto-create missing fee record
  if (!fees) {
    fees = {};
    months.forEach(m => (fees[m] = "Due"));
    await setDoc(doc(db, "fees", year, "students", studentId), fees);
  }

  document.getElementById("studentID").textContent =
    `Student ID: ${student.id}`;
  document.getElementById("studentTitle").textContent =
    `Fee Payment for: ${student.name}`;
  document.getElementById("yearTitle").textContent =
    `Year: ${year}`;

  const table = document.getElementById("paymentTable");
  table.innerHTML = "";

  months.forEach(month => {
    const status = fees[month] || "Due";

    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${month}</td>

      <td>
        <div class="mark-buttons">
          <button class="tick" onclick="setStatus('${studentId}','${month}','Paid')">✔</button>
          <button class="cross" onclick="setStatus('${studentId}','${month}','Due')">✖</button>
        </div>
      </td>

      <td>
        <span class="status-box ${status === "Paid" ? "paid-box" : "due-box"}">
          ${status}
        </span>
      </td>
    `;
    table.appendChild(row);
  });
}

/* ============================================================
   UPDATE STATUS
============================================================ */
window.setStatus = async function (studentId, month, value) {
  const year = new Date().getFullYear().toString();

  await saveFeeStatus(year, studentId, month, value);

  loadPaymentPage(); // Refresh
};
