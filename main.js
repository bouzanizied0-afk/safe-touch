import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = { /* إعداداتك كما هي */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const pulseRef = ref(db, "temporal/heartbeat");

// --- 1. العداد الدوري السريع ---
let counter = 1;
let suppressedValue = null; // الرقم الذي سنقوم بحذفه

// محرك العداد (يدور من 1 إلى 255)
// هذه هي "القلعة" التي لا تتوقف عن النبض
setInterval(() => {
    if (counter > 255) counter = 1;

    // "قانون الحذف": إذا كان الرقم الحالي هو الرقم المراد إرساله، لا ترسل شيئاً
    if (counter === suppressedValue) {
        console.log("تم حذف النبضة: ", counter);
        suppressedValue = null; // إعادة ضبط بعد الحذف
    } else {
        // إرسال النبضة العادية للسيرفر
        set(pulseRef, counter);
    }
    
    counter++;
}, 100); // سرعة النبض (يمكن زيادتها لاحقاً)

// --- 2. وظيفة الإرسال عبر "الحذف" ---
window.sendBySuppression = (char) => {
    // تحويل الحرف إلى رقمه المقابل في لغة الآلة (ASCII)
    const charCode = char.charCodeAt(0);
    suppressedValue = charCode; // نأمر المحرك بحذف هذا الرقم في الدورة القادمة
};

// --- 3. محرك الاستقبال (مراقب الفجوات) ---
let lastValue = 0;
onValue(pulseRef, (snapshot) => {
    const currentValue = snapshot.val();
    const display = document.getElementById("chat-display");

    // إذا قفز العداد رقماً واحداً (مثلاً من 4 إلى 6)
    // هذا يعني أن الرقم 5 تم حذفه عمداً
    if (currentValue === lastValue + 2 || (currentValue === 1 && lastValue === 254)) {
        const missingChar = String.fromCharCode(lastValue + 1);
        display.innerHTML += `<div>استقبال عبر الفجوة: <b>${missingChar}</b></div>`;
    }
    
    lastValue = currentValue;
});
