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

  // Store login timestamp for auto logout
  localStorage.setItem("loginTime", Date.now().toString());

  // Redirect to dashboard
  window.location.href = "index.html";
};

/* =========================================================
   AUTO LOGOUT after 8 hours
========================================================= */
function checkAutoLogout() {
  const loginTime = localStorage.getItem("loginTime");
  if (!loginTime) return;

  const now = Date.now();
  const eightHours = 8 * 60 * 60 * 1000;

  if (now - Number(loginTime) >= eightHours) {
    alert("Session expired. Please log in again.");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("logged_role");
    window.location.href = "login.html";
  }
}
/* =========================================================
   LOGOUT FUNCTION
========================================================= */
window.logout = function () {
  localStorage.removeItem("logged_role");
  localStorage.removeItem("loginTime");

  alert("You have been logged out.");
  window.location.href = "login.html";
};


// Run check every minute
setInterval(checkAutoLogout, 60000);

// Check on page load
checkAutoLogout();

