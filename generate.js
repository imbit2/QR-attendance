import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

let generatedIds = [];

/* ============================================================
   GET LAST PTC ID FROM FIREBASE
============================================================ */
async function getLastPTCId() {
  const ref = doc(db, "config", "lastPTCId");
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { last: 0 });
    return 0;
  }

  return snap.data().last;
}

/* ============================================================
   SET LAST PTC ID IN FIREBASE
============================================================ */
async function updateLastPTCId(newVal) {
  const ref = doc(db, "config", "lastPTCId");
  await updateDoc(ref, { last: newVal });
}

/* ============================================================
   SAVE STUDENTS TO FIREBASE
============================================================ */
async function saveGeneratedIdsToStudents(ids) {
  const studentsRef = collection(db, "students");

  for (let id of ids) {
    const studentDoc = doc(db, "students", id);

    const snap = await getDoc(studentDoc);
    if (!snap.exists()) {
      await setDoc(studentDoc, {
        id,
        name: "",
        guardian: "",
        dob: "",
        address: "",
        belt: "",
        phone: "",
        gender: "",
      });
    }
  }
}

/* ============================================================
   GENERATE BULK QR
============================================================ */
async function generateBulk() {
  const count = parseInt(document.getElementById("qrCount").value);
  if (!count) {
    alert("Please select quantity");
    return;
  }

  let lastPTC = await getLastPTCId();

  const qrGrid = document.getElementById("qrGrid");
  qrGrid.innerHTML = "";
  generatedIds = [];

  for (let i = 1; i <= count; i++) {
    const num = lastPTC + i;
    const studentId = "PTC" + String(num).padStart(4, "0");
    generatedIds.push(studentId);

    const box = document.createElement("div");
    box.className = "qr-box";

    const idDiv = document.createElement("div");
    idDiv.className = "qr-id";
    idDiv.innerText = studentId;

    const qrDiv = document.createElement("div");
    qrDiv.className = "qr-container";

    box.appendChild(idDiv);
    box.appendChild(qrDiv);
    qrGrid.appendChild(box);

    new QRCode(qrDiv, {
      text: studentId,
      width: 76,
      height: 76,
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  await saveGeneratedIdsToStudents(generatedIds);
  await updateLastPTCId(lastPTC + count);

  alert("QR Generated & Saved in Firebase!");
}

/* ============================================================
   EXPORT PNG
============================================================ */
async function exportPNG() {
  const qrGrid = document.getElementById("qrGrid");

  if (!qrGrid || qrGrid.children.length === 0) {
    alert("Generate QR codes first");
    return;
  }

  const canvas = await html2canvas(qrGrid, {
    backgroundColor: "#ffffff",
    scale: 2
  });

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "PTC_Bulk_QR.png";
  link.click();
}

/* ============================================================
   EXPORT PDF (SAME AS YOUR ORIGINAL)
============================================================ */
async function exportPDF() {
  if (generatedIds.length === 0) {
    alert("Generate QR codes first");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const cards = document.querySelectorAll(".qr-box");

  const cardW = 20;
  const cardH = 27;
  const qrSize = 16;

  const marginX = 10;
  const marginY = 10;
  const gapX = 4;
  const gapY = 6;
  const maxCols = 7;

  let x = marginX;
  let y = marginY;
  let col = 0;

  for (let i = 0; i < cards.length; i++) {
    const qrCanvas = cards[i].querySelector("canvas, img");
    if (!qrCanvas) continue;

    const qrImg =
      qrCanvas.tagName === "CANVAS"
        ? qrCanvas.toDataURL("image/png")
        : qrCanvas.src;

    const idText = generatedIds[i];

    pdf.setLineWidth(0.2);
    pdf.rect(x, y, cardW, cardH);

    pdf.setFontSize(8);
    pdf.text(idText, x + cardW / 2, y + 5, { align: "center" });

    pdf.addImage(qrImg, "PNG", x + (cardW - qrSize) / 2, y + 8, qrSize, qrSize);

    col++;
    x += cardW + gapX;

    if (col === maxCols) {
      col = 0;
      x = marginX;
      y += cardH + gapY;

      if (y + cardH > 280) {
        pdf.addPage();
        y = marginY;
      }
    }
  }

  pdf.save("PTC_QR_A4_Print.pdf");
}

/* ============================================================
   EXPORT FUNCTIONS TO HTML
============================================================ */
window.generateBulk = generateBulk;
window.exportPNG = exportPNG;
window.exportPDF = exportPDF;

