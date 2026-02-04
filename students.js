// student_list.js (FIREBASE VERSION)

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

let students = [];
window.studentsCache = []; // accessible from scan_qr.js

/* =====================================================
   LOAD STUDENTS FROM FIREBASE
===================================================== */
async function loadStudentsFromFirebase() {
  try {
    const querySnapshot = await getDocs(collection(db, "students"));

    students = [];
    querySnapshot.forEach(doc => {
      students.push(doc.data());
    });

    // Keep for QR scanner
    window.studentsCache = students;

    renderStudentList(students);
  } catch (error) {
    console.error("Error loading students:", error);
    alert("Failed to load students from database.");
  }
}

/* =====================================================
   DOM READY → LOAD DATA
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadStudentsFromFirebase();

  // Search listener
  const searchBox = document.getElementById("searchInput");
  if (searchBox) {
    searchBox.addEventListener("input", searchStudent);
  }
});

/* =====================================================
   RENDER TABLE
===================================================== */
function renderStudentList(list) {
  const tbody = document.getElementById("studentTableBody");
  tbody.innerHTML = "";

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No students found</td></tr>`;
    return;
  }

  list.forEach(student => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <a href="student_profile.html?id=${student.id}" 
           target="_blank"
           style="font-weight:600; color:#3498db; text-decoration:none;">
          ${student.id}
        </a>
      </td>

      <td>${student.name || "-"}</td>

      <td>
        <a href="edit_student.html?id=${student.id}" class="small-btn">
          Edit
        </a>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* =====================================================
   LIVE SEARCH
===================================================== */
function searchStudent() {
  const q = document.getElementById("searchInput").value.toLowerCase();

  const filtered = students.filter(s =>
    s.id.toLowerCase().includes(q) ||
    (s.name || "").toLowerCase().includes(q)
  );

  renderStudentList(filtered);
}

window.clearSearch = function () {
  document.getElementById("searchInput").value = "";
  renderStudentList(students);
};

/* =====================================================
   FORCE REFRESH WHEN RETURNING TO PAGE
===================================================== */
window.addEventListener("pageshow", async function (event) {
  if (event.persisted) {
    await loadStudentsFromFirebase();
  }
});
