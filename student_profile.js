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

/* ==========================================================
      LOAD ATTENDANCE HISTORY (FIRESTORE)
========================================================== */
// Expected Firestore structure:
// attendance
//    └── 2026-02-05
//          └── studentId { status, scans: ["09:00","11:00"] }

async function loadAttendanceHistory() {
  const historyDiv = document.getElementById("attendanceHistory");
  let html = "";
  let found = false;

  try {
    const attendanceCol = collection(db, "attendance");
    const datesSnapshot = await getDocs(attendanceCol);

    let dateList = [];

    datesSnapshot.forEach(d => dateList.push(d.id));

    // Sort ascending
    dateList.sort();

    for (const date of dateList) {
      const recordRef = doc(db, "attendance", date);
      const recordSnap = await getDoc(recordRef);

      if (recordSnap.exists()) {
        const recordData = recordSnap.data();

        const studentRecord = recordData[studentId];

        if (studentRecord) {
          found = true;

          const inTime = studentRecord.scans?.[0] || "-";
          const outTime = studentRecord.scans?.[1] || "-";

          html += `
            <div style="margin-bottom:8px;">
              <strong>${date}</strong>
              &nbsp; | &nbsp; ${studentRecord.status}
              &nbsp; | &nbsp; In: ${inTime}
              &nbsp; | &nbsp; Out: ${outTime}
            </div>
          `;
        }
      }
    }

    if (!found) {
      html = "<p>No attendance record found</p>";
    }

    historyDiv.innerHTML = html;

  } catch (err) {
    console.error(err);
    historyDiv.innerHTML = "<p>Error loading attendance history</p>";
  }
}

loadAttendanceHistory();

