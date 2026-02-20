import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* =====================================================
   GLOBAL PAGINATION STATE
===================================================== */
let studentsList = [];
let currentPage = 1;
const itemsPerPage = 10;

/* =====================================================
   FETCH STUDENTS
===================================================== */
async function getStudents() {
  const snapshot = await getDocs(collection(db, "students"));
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

/* =====================================================
   FETCH FEES OF A YEAR
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
   SAVE FEES
===================================================== */
async function saveStudentFees(year, studentId, data) {
  await setDoc(
    doc(db, "fees", year.toString(), "students", studentId.toString()),
    data,
    { merge: true }
  );
}

/* =====================================================
   MONTHS
===================================================== */
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* =====================================================
   ON PAGE LOAD
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadYearDropdown();
  await loadStudents();
  loadPage(1);
});

/* =====================================================
   LOAD STUDENT LIST ONCE
===================================================== */
async function loadStudents() {
  studentsList = await getStudents();
}

/* =====================================================
   YEAR DROPDOWN
===================================================== */
async function loadYearDropdown() {
  let dropdown = document.getElementById("yearDropdown");
  let currentYear = new Date().getFullYear().toString();

  dropdown.innerHTML = `<option value="${currentYear}">${currentYear}</option>`;
  dropdown.value = currentYear;

  dropdown.addEventListener("change", () => loadPage(1));
}

/* =====================================================
   LOAD PAGINATED PAGE
===================================================== */
async function loadPage(page) {
  currentPage = page;

  let tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  const year = document.getElementById("yearDropdown").value;
  let fees = await getFeesForYear(year);

  // Slicing logic
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageStudents = studentsList.slice(start, end);

  for (let stu of pageStudents) {
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
      <td><a href="fee_payment.html" onclick="openFeePayment('${stu.id}')">Manage</a></td>
    `;

    tbody.appendChild(tr);
  }

  renderPagination();
}

/* =====================================================
   PAGINATION BUTTONS
===================================================== */
function renderPagination() {
  const container = document.getElementById("paginationContainer");
  container.innerHTML = "";

  const totalPages = Math.ceil(studentsList.length / itemsPerPage);

  if (totalPages <= 1) return;

  // ---- PREVIOUS BUTTON ----
  let prevBtn = document.createElement("button");
  prevBtn.textContent = "<<";
  prevBtn.className = currentPage === 1 ? "disabled" : "";
  prevBtn.onclick = () => {
    if (currentPage > 1) loadPage(currentPage - 1);
  };
  container.appendChild(prevBtn);

  // ---- PAGE RANGE LOGIC ----
  let maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  // ---- SHOW FIRST PAGE + "..." ----
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) addEllipsis();
  }

  // ---- MIDDLE PAGES ----
  for (let i = startPage; i <= endPage; i++) addPageButton(i);

  // ---- SHOW LAST PAGE + "..." ----
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) addEllipsis();
    addPageButton(totalPages);
  }

  // ---- NEXT BUTTON ----
  let nextBtn = document.createElement("button");
  nextBtn.textContent = ">>";
  nextBtn.className = currentPage === totalPages ? "disabled" : "";
  nextBtn.onclick = () => {
    if (currentPage < totalPages) loadPage(currentPage + 1);
  };
  container.appendChild(nextBtn);

  /* Helper Functions */
  function addPageButton(i) {
    let btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === currentPage) ? "active-page" : "";
    btn.onclick = () => loadPage(i);
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
   OPEN PAYMENT PAGE
===================================================== */
window.openFeePayment = function(studentId) {
  localStorage.setItem("feeSelectedStudent", studentId);
};

/* =====================================================
   EXPORT EXCEL
===================================================== */
window.exportFeesExcel = async function () {
  let year = document.getElementById("yearDropdown").value;
  let fees = await getFeesForYear(year);
  let students = studentsList;

  let rows = [
    ["Student ID","Name",...months]
  ];

  students.forEach(stu => {
    let row = [stu.id, stu.name];
    months.forEach(m => row.push(fees[stu.id]?.[m] || "Due"));
    rows.push(row);
  });

  let csv = rows.map(r => r.join(",")).join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = `Fees_${year}.csv`;
  a.click();
};


