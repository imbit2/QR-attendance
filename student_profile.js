import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* ==========================================================
      GET STUDENT ID FROM URL
========================================================== */
const params = new URLSearchParams(location.search);
const studentId = params.get("id");

if (!studentId) {
  alert("Invalid student");
  window.close();
}

/* ==========================================================
      LOAD STUDENT DATA FROM FIRESTORE
========================================================== */
async function loadStudent() {
  try {
    const snap = await getDoc(doc(db, "students", studentId));

    if (!snap.exists()) {
      alert("Student not found in database");
      window.close();
      return;
    }

    const student = snap.data();

    // Fill Profile
    document.getElementById("pId").innerText = studentId;
    document.getElementById("pName").innerText = student.name || "-";
    document.getElementById("pGuardian").innerText = student.guardian || "-";
    document.getElementById("pDob").innerText = student.dob || "-";
    document.getElementById("pBelt").innerText = student.belt || "-";
    document.getElementById("pPhone").innerText = student.phone || "-";
    document.getElementById("pAddress").innerText = student.address || "-";
    document.getElementById("pGender").innerText = student.gender || "-";

    /* Generate QR Code */
    new QRCode(document.getElementById("qrBox"), {
      text: studentId,
      width: 100,
      height: 100,
      correctLevel: QRCode.CorrectLevel.H
    });

  } catch (err) {
    console.error(err);
    alert("Failed to load student.");
  }
}

loadStudent();
loadAttendanceHistory();
/* ==========================================================
      LOAD ATTENDANCE HISTORY (WITH PAGINATION)
========================================================== */

let attendanceHistory = [];   // store all records
let attendancePage = 1;
const attendancePerPage = 7;

async function loadAttendanceHistory() {
  const historyDiv = document.getElementById("attendanceHistory");

  try {
    const datesSnapshot = await getDocs(collection(db, "attendance"));

    let records = [];

    datesSnapshot.forEach(docSnap => {
      const date = docSnap.id;
      const data = docSnap.data();

      if (data[studentId]) {
        const rec = data[studentId];

        records.push({
          date,
          status: rec.status,
          inTime: rec.scans?.[0] || "-",
          outTime: rec.scans?.[1] || "-"
        });
      }
    });

    if (records.length === 0) {
      historyDiv.innerHTML = "<p>No attendance record found</p>";
      return;
    }

    // Sort latest first
    attendanceHistory = records.sort((a, b) => (a.date < b.date ? 1 : -1));

    renderAttendancePage();
    renderAttendancePagination();

  } catch (err) {
    console.error(err);
    historyDiv.innerHTML = "<p>Error loading attendance history</p>";
  }
}
/* ==========================================================
      ATTENDANCE PAGINATION
========================================================== */

function renderAttendancePage() {
  const historyDiv = document.getElementById("attendanceHistory");
  historyDiv.innerHTML = "";

  const start = (attendancePage - 1) * attendancePerPage;
  const end = start + attendancePerPage;

  const pageItems = attendanceHistory.slice(start, end);

  let html = "";

  pageItems.forEach(r => {
    html += `
      <div class="attendance-item">
        <strong>${r.date}</strong>
        &nbsp; | &nbsp; ${r.status}
        &nbsp; | &nbsp; In: ${r.inTime}
        &nbsp; | &nbsp; Out: ${r.outTime}
      </div>
    `;
  });

  historyDiv.innerHTML = html;
}

function renderAttendancePagination() {
  const container = document.getElementById("attendancePagination");
  if (!container) return;

  container.innerHTML = "";

  const totalPages = Math.ceil(attendanceHistory.length / attendancePerPage);
  if (totalPages <= 1) return;

  /* PREV BUTTON */
  const prev = document.createElement("button");
  prev.textContent = "<<";
  prev.disabled = attendancePage === 1;
  prev.onclick = () => {
    attendancePage--;
    renderAttendancePage();
    renderAttendancePagination();
  };
  container.appendChild(prev);

  /* PAGE NUMBERS (MAX 5) */
  let maxPages = 5;
  let start = Math.max(1, attendancePage - 2);
  let end = Math.min(totalPages, start + maxPages - 1);

  if (end - start < 4) start = Math.max(1, end - 4);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === attendancePage ? "active-page" : "";
    btn.onclick = () => {
      attendancePage = i;
      renderAttendancePage();
      renderAttendancePagination();
    };
    container.appendChild(btn);
  }

  /* NEXT BUTTON */
  const next = document.createElement("button");
  next.textContent = ">>";
  next.disabled = attendancePage === totalPages;
  next.onclick = () => {
    attendancePage++;
    renderAttendancePage();
    renderAttendancePagination();
  };
  container.appendChild(next);
}

