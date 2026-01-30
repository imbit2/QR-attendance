import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const studentList = document.getElementById("studentList");

async function loadStudents() {
    const querySnapshot = await getDocs(collection(db, "students"));

    querySnapshot.forEach((doc) => {
        let li = document.createElement("li");
        li.textContent = doc.data().id;
        studentList.appendChild(li);
    });
}

loadStudents();

