// students.js (FIREBASE VERSION + FIXED PAGINATION)

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
   CHANGE PAGE (MAIN PAGINATION FN)
===================================================== */
function changePage(page) {
  currentPage = page;
  renderTable();
  renderPagination();
}

/* =====================================================
   PAGINATION (5 main buttons + PREV + NEXT + ELLIPSIS)
===================================================== */
function renderPagination() {
  const container = document.getElementById("paginationContainer");
  container.innerHTML = "";

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  if (totalPages <= 1) return;

  /* ---- PREVIOUS BUTTON ---- */
  let prevBtn = document.createElement("button");
  prevBtn.textContent = "<<";
  prevBtn.className = currentPage === 1 ? "disabled" : "";
  prevBtn.onclick = () => {
    if (currentPage > 1) changePage(currentPage - 1);
  };
  container.appendChild(prevBtn);

  /* ---- PAGE RANGE CALCULATION ---- */
  let maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  /* ---- FIRST PAGE + "..." ---- */
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) addEllipsis();
  }

  /* ---- MIDDLE PAGES ---- */
  for (let i = startPage; i <= endPage; i++) addPageButton(i);

  /* ---- LAST PAGE + "..." ---- */
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) addEllipsis();
    addPageButton(totalPages);
  }

  /* ---- NEXT BUTTON ---- */
  let nextBtn = document.createElement("button");
  nextBtn.textContent = ">>";
  nextBtn.className = currentPage === totalPages ? "disabled" : "";
  nextBtn.onclick = () => {
    if (currentPage < totalPages) changePage(currentPage + 1);
  };
  container.appendChild(nextBtn);

  /* ---- Helper Functions ---- */
  function addPageButton(i) {
    let btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === currentPage) ? "active-page" : "";
    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }

  function addEllipsis() {
    let span = document.createElement("button");
    span.textContent = "...";
    span.className = "disabled";
    span.style.cursor = "default";
    container.appendChild(span);
  }
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

/* Clear search */
window.clearSearch = function () {
  document.getElementById("searchInput").value = "";
  filteredStudents = [...students];
  currentPage = 1;
  renderTable();
  renderPagination();
};

/* Force reload when navigating back */
window.addEventListener("pageshow", async function (event) {
  if (event.persisted) {
    await loadStudentsFromFirebase();
  }
});
