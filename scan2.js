import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const resultEl = document.getElementById("result");

function onScanSuccess(decodedText) {
    resultEl.innerHTML = "Scanned ID: " + decodedText;
    saveAttendance(decodedText);
}

async function saveAttendance(studentId) {
    try {
        await addDoc(collection(db, "attendance"), {
            studentId: studentId,
            time: serverTimestamp()
        });

        resultEl.innerHTML += "<br>Attendance Marked!";
    } catch (error) {
        resultEl.innerHTML += "<br>Error marking attendance.";
        console.error(error);
    }
}

const html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { fps: 10, qrbox: 250 }
);

html5QrcodeScanner.render(onScanSuccess);
