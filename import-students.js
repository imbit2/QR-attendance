import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

window.importStudents = async function () {

    const fileInput = document.getElementById("excelFile");
    if (!fileInput.files.length) {
        alert("Please select an Excel or CSV file.");
        return;
    }

    const file = fileInput.files[0];
    const fileName = file.name.toLowerCase();

    const reader = new FileReader();

    reader.onload = async (event) => {
        let rows = [];

        /* -------------------------------
           1️⃣ EXCEL FILE (xlsx / xls)
        ------------------------------- */
        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: "binary" });

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            rows = XLSX.utils.sheet_to_json(sheet);
        }

        /* -------------------------------
           2️⃣ CSV FILE
        ------------------------------- */
        else if (fileName.endsWith(".csv")) {
            const text = event.target.result;

            // Convert CSV → JSON using SheetJS
            const workbook = XLSX.read(text, { type: "string" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            rows = XLSX.utils.sheet_to_json(sheet);
        }

        else {
            alert("Unsupported file format. Upload .xlsx, .xls, or .csv");
            return;
        }

        /* -------------------------------
           PROCESS STUDENT DATA
        ------------------------------- */
        let imported = 0;

        for (let row of rows) {
            const id = row.id?.toString().trim();
            if (!id) continue;

            const studentData = {
                name: row.name || "",
                guardian: row.guardian || "",
                dob: row.dob || "",
                belt: row.belt || "",
                phone: row.phone || "",
                address: row.address || "",
                gender: row.gender || "",
                updatedAt: new Date().toLocaleString("en-IN")
            };

            await setDoc(doc(db, "students", id), studentData, { merge: true });
            imported++;
        }

        alert(`Successfully imported ${imported} students.`);
    };

    /* -------------------------------
       FileReader Mode
    ------------------------------- */
    if (fileName.endsWith(".csv")) {
        reader.readAsText(file);          // CSV needs readAsText
    } else {
        reader.readAsBinaryString(file);  // Excel needs binary
    }
};

