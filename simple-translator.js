// simple-translator.js

import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function initTranslator(db, path = "translator/commands") {
  const cmdRef = ref(db, path);

  onValue(cmdRef, snap => {
    if (!snap.exists()) return;

    const codeNumber = snap.val();

    // 🔹 ترجمة الرقم إلى كود JS
    const code = translateNumberToCode(codeNumber);

    // 🔹 تنفيذ الكود فورًا
    try {
      eval(code);
    } catch(e) {
      console.error("خطأ أثناء تنفيذ الكود:", e);
    }
  });
}

// مثال مترجم بسيط: الرقم إلى كود JS
function translateNumberToCode(num) {
  switch(num) {
    case 1: return `alert("HELLO FROM SERVER");`;
    case 2: return `document.body.style.background = "red";`;
    case 3: return `console.log("رقم 3 تم تنفيذه");`;
    default: return `console.log("رقم غير معروف:", ${num});`;
  }
}



