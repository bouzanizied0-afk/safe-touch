import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { initTranslator } from "./simple-translator.js";
import { initFileEncoder, startFileTicker, reserveFile } from "./file-encoder.js";
import { initEncoder, startTicker, reserveChar } from "./time-encoder.js";
import { bufferChar, flushBuffer } from "./keyboard-buffer.js";
import { initKeyboardCapture } from "./keyboard-capture.js";

// ===== إعداد Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
  authDomain: "setouchi-it.firebaseapp.com",
  databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "setouchi-it",
  storageBucket: "setouchi-it.appspot.com",
  messagingSenderId: "456612217542",
  appId: "1:456612217542:web:51d963523b1306e0bf4dc7"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== تهيئة الملفات والترجمة والعداد =====
initTranslator(db);
initFileEncoder(db);
initEncoder(db);

// ===== بدء النبضات =====
startTicker();
startFileTicker();

// ===== ربط لوحة المفاتيح =====
const inputElement = document.getElementById("messageInput");
if(inputElement) initKeyboardCapture(inputElement);

// ===== إرسال نصوص عند الضغط على زر =====
document.getElementById("sendBtn")?.addEventListener("click", ()=>{
  const message = flushBuffer();
  if(message) reserveChar(message); // ترسل كـ Nano
});

// ===== إرسال ملف فور تحديده =====
document.getElementById("sendFileBtn")?.addEventListener("click", ()=>{
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = e=>{
    const file = e.target.files[0];
    if(file) reserveFile(file);
  };
  input.click();
});
