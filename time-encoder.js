// ===== time-encoder.js =====

import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔗 ربط بالخادم (تم تمرير db من index.js أو من ملف رئيسي)
let dbInstance = null;
let timeRef = null;

// الانتظار المحلي للحروف
const queue = []; // عناصر: { char: "ف", nano: 872391002 }

// تهيئة الاتصال بالخادم
export function initEncoder(db, path = "temporal/nano") {
  dbInstance = db;
  timeRef = ref(dbInstance, path);
}

// إنشاء Nano رقمي (يمكن ربطه بالوقت العالمي لاحقًا)
export function generateNano() {
  return Date.now(); // مثال: كل ميللي ثانية Nano فريد
}

// إضافة حرف مؤقت للانتظار
export function reserveChar(char) {
  const nano = generateNano();
  queue.push({ char, nano });
  console.log(`حجز حرف '${char}' عند Nano ${nano}`);
}

// إرسال Nano إلى الخادم
function sendNano(nano) {
  if (!timeRef) return;
  set(timeRef, nano);
}

// عرض الحرف في الواجهة (يمكن تعديل الدالة حسب id العنصر)
function displayChar(char) {
  const container = document.getElementById("letter-display");
  if (!container) return;
  const div = document.createElement("div");
  div.textContent = char;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// نبض المراقبة والتحريك
export function startTicker() {
  setInterval(() => {
    const now = generateNano();
    queue.forEach((item, index) => {
      if (item.nano <= now) {
        sendNano(item.nano);     // إرسال الرقم فقط
        displayChar(item.char);  // عرض الحرف في الواجهة
        queue.splice(index, 1);  // إزالة العنصر بعد الإرسال
      }
    });
  }, 10); // نفحص كل 10ms
}
