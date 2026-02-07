import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

window.importStudents = async function () {

    const fileInput = document.getElementById("excelFile");
    if (!fileInput.files.length) {
        alert("Please select an Excel file first.");
        return;
    }

    const file = fileInput.files[0];

    // Read file
    const reader = new FileReader();
    reader.onload = async (event) => {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // First sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(sheet);

        let imported = 0;

        for (let row of rows) {

            // Clean student object (IGNORE attendance fields)
            const studentData = {
                name: row.name || "",
                guardian: row.guardian || "",
                dob: row.dob || "",
                belt: row.belt || "",
                phone: row.phone || "",
                address: row.address || "",
                updatedAt: new Date().toLocaleString("en-IN") // local time
            };

            const id = row.id?.toString();

            if (!id) continue;

            // Save to /students/<id>
            await setDoc(doc(db, "students", id), studentData, { merge: true });

            imported++;
        }

        alert(`Successfully imported ${imported} students.`);

    };

    reader.readAsBinaryString(file);
};
