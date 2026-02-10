import { db } from "./firebase-config.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* =========================================================
   LOGIN FUNCTION (Firebase Version)
========================================================= */
window.login = async function () {

  const id = document.getElementById("loginId").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  if (!id || !pass) {
    alert("Enter both User ID and Password");
    return;
  }

  const userRef = doc(db, "loginAccounts", id);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    alert("Invalid User ID");
    return;
  }

  const data = snap.data();

  // Check password
  if (data.password !== pass) {
    alert("Wrong Password");
    return;
  }

  // Store role locally (admin/coach)
  localStorage.setItem("logged_role", data.role);

  // Redirect to dashboard
  window.location.href = "index.html";
};
