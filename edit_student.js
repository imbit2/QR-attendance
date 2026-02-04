import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ==========================================================
      GET STUDENT ID FROM URL
========================================================== */
const params = new URLSearchParams(location.search);
const studentId = params.get("id");

if (!studentId) {
  alert("Invalid student ID");
  location.href = "student_list.html";
}

/* ==========================================================
      LOAD STUDENT DATA FROM FIRESTORE
========================================================== */
let student = null;

async function loadStudent() {
  try {
    const doc = await db.collection("students").doc(studentId).get();
    if (!doc.exists) {
      alert("Student not found in database");
      location.href = "student_list.html";
      return;
    }

    student = doc.data();

    // Fill form
    document.getElementById("studentId").value = studentId;
    document.getElementById("studentName").value = student.name || "";
    document.getElementById("studentGuardian").value = student.guardian || "";
    document.getElementById("studentDob").value = student.dob || "";
    document.getElementById("studentBelt").value = student.belt || "";
    document.getElementById("studentAddress").value = student.address || "";
    document.getElementById("studentPhone").value = student.phone || "";

  } catch (err) {
    console.error(err);
    alert("Failed to load student");
  }
}

loadStudent();

/* ==========================================================
      UPDATE STUDENT (FIRESTORE)
========================================================== */
async function updateStudent() {
  adminOnly(); // if you are using this security function

  const updated = {
    name: document.getElementById("studentName").value.trim(),
    guardian: document.getElementById("studentGuardian").value.trim(),
    dob: document.getElementById("studentDob").value,
    belt: document.getElementById("studentBelt").value.trim(),
    address: document.getElementById("studentAddress").value.trim(),
    phone: document.getElementById("studentPhone").value.trim(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await db.collection("students").doc(studentId).update(updated);
    alert("Student updated successfully ✅");
  } catch (err) {
    console.error(err);
    alert("Error updating student");
  }
}

/* ==========================================================
      REPRINT CARD
========================================================== */
function reprintCard() {
  location.href = "generate_student_qr.html?id=" + studentId;
}
