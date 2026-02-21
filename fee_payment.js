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
   FETCH STUDENT LIST
============================================================ */
async function getStudents() {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/* ============================================================
   FETCH FEES FOR YEAR
============================================================ */
async function getFees(year, studentId) {
  const ref = doc(db, "fees", year.toString(), "students", studentId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/* ============================================================
   SAVE STATUS OR AMOUNT
============================================================ */
async function saveFeeField(year, studentId, month, field, value) {
  const ref = doc(db, "fees", year.toString(), "students", studentId);

  // Ensure full object merge
  await setDoc(
    ref,
    {
      [month]: {
        status: field === "status" ? value : undefined,
        amount: field === "amount" ? value : undefined
      }
    },
    { merge: true }
  );
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

  // Auto-create missing record
  if (!fees) {
    fees = {};
    months.forEach(m => (fees[m] = { status: "Due", amount: "" }));
    await setDoc(doc(db, "fees", year, "students", studentId), fees);
  }

  document.getElementById("studentID").textContent = `Student ID: ${student.id}`;
  document.getElementById("studentTitle").textContent = `Fee Payment for: ${student.name}`;
  document.getElementById("yearTitle").textContent = `Year: ${year}`;

  const table = document.getElementById("paymentTable");
  table.innerHTML = "";

  months.forEach(month => {
    const entry = fees[month] || { status: "Due", amount: "" };

    // Ensure default status = DUE always
    const status = entry.status || "Due";

    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${month}</td>

      <!-- AMOUNT COLUMN (2nd) -->
      <td>
        <div style="display:flex; gap:4px;">
          <input 
            type="number" 
            id="amount-${month}"
            placeholder="₹"
            value="${entry.amount || ""}"
            style="width:70px; padding:3px;"
          >
          <button 
            onclick="saveAmount('${studentId}', '${month}')"
            style="padding:4px 6px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;"
          >💾</button>
        </div>
      </td>

      <!-- MARK BUTTONS COLUMN (3rd) -->
      <td>
        <div class="mark-buttons">
          <button class="tick" onclick="setStatus('${studentId}','${month}','Paid')">✔</button>
          <button class="cross" onclick="setStatus('${studentId}','${month}','Due')">✖</button>
        </div>
      </td>

      <!-- STATUS + WHATSAPP COLUMN (4th) -->
     <td>
  <span class="status-box ${status === "Paid" ? "paid-box" : "due-box"}">
    ${status}
  </span>

  <button 
    class="wa-btn"
    onclick="sendWhatsApp('${student.phone}','${student.name}','${month}','${entry.amount || ""}','${status}')"
  >
    <img src="images/whatsapp-icon.png" class="wa-icon">
  </button>
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
  await saveFeeField(year, studentId, month, "status", value);
  loadPaymentPage(); // refresh UI
};

/* ============================================================
   SAVE AMOUNT
============================================================ */
window.saveAmount = async function(studentId, month) {
  const year = new Date().getFullYear().toString();
  const input = document.getElementById(`amount-${month}`);
  const amount = input.value.trim();

  if (amount === "") {
    alert("Please enter an amount.");
    return;
  }

  await saveFeeField(year, studentId, month, "amount", Number(amount));

  alert("Amount saved!");
};

/* ============================================================
   SEND WHATSAPP MESSAGE
============================================================ */
window.sendWhatsApp = function(phone, name, month, amount, status) {
  if (!phone) {
    alert("Student phone number missing!");
    return;
  }

  let msg =
`Hello ${name},
Here is your fee update:

Month: ${month}
Amount: ₹${amount || "Not Entered"}
Status: ${status}

Thank you!`;

  let url = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
};


