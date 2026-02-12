// students.js (FIREBASE VERSION + PAGINATION)

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

let students = [];
let filteredStudents = [];

let currentPage = 1;
let rowsPerPage = 10;

/* =====================================================
   LOAD STUDENTS FROM FIREBASE
===================================================== */
async function loadStudentsFromFirebase() {
  try {
    const snap = await getDocs(collection(db, "students"));

    students = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    window.studentsCache = students;

    filteredStudents = [...students];
    renderTable();
    renderPagination();

  } catch (error) {
    console.error("Error loading students:", error);
    alert("Failed to load students from database.");
  }
}

/* =====================================================
   DOM READY
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadStudentsFromFirebase();

  const searchBox = document.getElementById("searchInput");
  if (searchBox) {
    searchBox.addEventListener("input", searchStudent);
  }
});

/* =====================================================
   RENDER TABLE WITH PAGINATION
===================================================== */
function renderTable() {
  const tbody = document.getElementById("studentTableBody");
  tbody.innerHTML = "";

  if (filteredStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No students found</td></tr>`;
    return;
  }

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const pageItems = filteredStudents.slice(start, end);

  pageItems.forEach(student => {
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
   PAGINATION (5 buttons + prev + next)
===================================================== */
function renderPagination() {
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const container = document.getElementById("paginationContainer");

  container.innerHTML = "";
  if (totalPages <= 1) return;

  const chunkSize = 5;
  const currentChunk = Math.floor((currentPage - 1) / chunkSize);
  const startPage = currentChunk * chunkSize + 1;
  const endPage = Math.min(startPage + chunkSize - 1, totalPages);

  // PREVIOUS BUTTON
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.className = "pagination-btn";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) currentPage--;
    renderTable();
    renderPagination();
  };
  container.appendChild(prevBtn);

  // PAGE NUMBERS (5)
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "pagination-btn";
    if (i === currentPage) btn.classList.add("active");

    btn.onclick = () => {
      currentPage = i;
      renderTable();
      renderPagination();
    };

    container.appendChild(btn);
  }

  // NEXT BUTTON
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.className = "pagination-btn";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) currentPage++;
    renderTable();
    renderPagination();
  };
  container.appendChild(nextBtn);
}

/* =====================================================
   SEARCH (RESETS PAGINATION)
===================================================== */
function searchStudent() {
  const q = document.getElementById("searchInput").value.toLowerCase();

  filteredStudents = students.filter(s =>
    s.id.toLowerCase().includes(q) ||
    (s.name || "").toLowerCase().includes(q)
  );

  currentPage = 1;
  renderTable();
  renderPagination();
}

window.clearSearch = function () {
  document.getElementById("searchInput").value = "";
  filteredStudents = [...students];
  currentPage = 1;
  renderTable();
  renderPagination();
};

/* =====================================================
   FORCE REFRESH WHEN RETURNING TO PAGE
===================================================== */
window.addEventListener("pageshow", async function (event) {
  if (event.persisted) {
    await loadStudentsFromFirebase();
  }
});
