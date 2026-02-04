import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* ==========================================================
      GET STUDENT ID FROM URL
========================================================== */
const params = new URLSearchParams(location.search);
const studentId = params.get("id");

if (!studentId) {
  alert("Invalid student ID");
  location.href = "students.html";
}

let studentDocRef = doc(db, "students", studentId);

/* ==========================================================
      LOAD STUDENT DATA FROM FIRESTORE
========================================================== */
async function loadStudent() {
  try {
    const snap = await getDoc(studentDocRef);

    if (!snap.exists()) {
      alert("Student not found in database.");
      location.href = "students.html";
      return;
    }

    const student = snap.data();

    document.getElementById("studentId").value = studentId;
    document.getElementById("studentName").value = student.name || "";
    document.getElementById("studentGuardian").value = student.guardian || "";
    document.getElementById("studentDob").value = student.dob || "";
    document.getElementById("studentBelt").value = student.belt || "";
    document.getElementById("studentAddress").value = student.address || "";
    document.getElementById("studentPhone").value = student.phone || "";

  } catch (err) {
    console.error(err);
    alert("Failed to load student from database.");
  }
}

loadStudent();

/* ==========================================================
      UPDATE STUDENT (FIRESTORE)
========================================================== */
async function updateStudent() {
  const updated = {
    name: document.getElementById("studentName").value.trim(),
    guardian: document.getElementById("studentGuardian").value.trim(),
    dob: document.getElementById("studentDob").value,
    belt: document.getElementById("studentBelt").value.trim(),
    address: document.getElementById("studentAddress").value.trim(),
    phone: document.getElementById("studentPhone").value.trim(),
    updatedAt: new Date().toLocaleString(),
  };

  try {
    await updateDoc(studentDocRef, updated);
    alert("Student updated successfully ✅");
  } catch (err) {
    console.error(err);
    alert("Error updating student.");
  }
}

/* Make updateStudent available to HTML */
window.updateStudent = updateStudent;

