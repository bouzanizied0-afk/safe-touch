import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. إعدادات Firebase ---
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

// المسارات
const syncRef = ref(db, "time/sync");
const pulseRef = ref(db, "temporal/v2_pulses"); // للملفات والكتل
const heartbeatRef = ref(db, "temporal/heartbeat"); // لنظام الحذف الزمني

const machineEncoder = new TextEncoder();
const machineDecoder = new TextDecoder();

// --- 2. المزامنة والعداد الدوري (القلعة) ---
let currentTick = 0;
let counter = 1;
let suppressedValue = null; 

onValue(syncRef, snap => { 
    if(snap.exists()) currentTick = snap.val(); 
    document.getElementById("global-tick").textContent = currentTick; 
    document.getElementById("status").textContent = "البوابة نشطة (نظام مزدوج) 🟢";
});

// محرك النبضات الدوري - يعمل في الخلفية باستمرار
setInterval(() => {
    if (counter > 255) counter = 1;

    // نظام الحذف الزمني: إذا كان الرقم هو الهدف، نسكُت
    if (counter === suppressedValue) {
        console.log("تم إسقاط النبضة رقم: ", counter);
        suppressedValue = null; 
    } else {
        set(heartbeatRef, counter);
    }
    
    counter++;
}, 150); // سرعة النبض (تعديلها يؤثر على سرعة نظام الحذف)

setInterval(() => { set(syncRef, (currentTick % 10) + 1); }, 1000);

// --- 3. محرك الإرسال الأول (نظام الحذف للنصوص السريعة) ---
function sendBySuppression(text) {
    let chars = text.split("");
    let delay = 0;
    chars.forEach((char) => {
        setTimeout(() => {
            suppressedValue = char.charCodeAt(0);
        }, delay);
        delay += 1000; // ننتظر دورة كاملة لكل حرف لضمان عدم التداخل
    });
}

// --- 4. محرك الإرسال الثاني (نظام الكتل للملفات والصور) ---
async function sendDataEng(data, type, mime = "") {
    const CHUNK_SIZE = 2048; 
    const baseId = Date.now();
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const obfuscated = Array.from(chunk).map(b => b ^ 0x0F); 
        await push(pulseRef, {
            d: obfuscated, idx: i / CHUNK_SIZE, id: baseId,
            t: type, m: mime, ts: serverTimestamp()
        });
    }
}

// أزرار الواجهة
document.getElementById("sendBtn").onclick = () => {
    const val = document.getElementById("userInput").value;
    if(!val) return;
    // نرسل النصوص عبر نظام "الحذف الزمني" لإخفائها
    sendBySuppression(val);
    document.getElementById("userInput").value = "";
};

document.getElementById("fileBtn").onclick = () => {
    const input = document.createElement('input'); 
    input.type = 'file';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => { 
            sendDataEng(new Uint8Array(evt.target.result), "file", file.type); 
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
};

// --- 5. محرك الاستقبال المزدوج ---

// أ. استقبال نظام الحذف (مراقب الفجوات)
let lastHValue = 0;
onValue(heartbeatRef, (snapshot) => {
    const currentHValue = snapshot.val();
    if (currentHValue === lastHValue + 2 || (currentHValue === 1 && lastHValue === 254)) {
        const missingChar = String.fromCharCode(lastHValue + 1);
        const display = document.getElementById("chat-display");
        display.innerHTML += `<div style="color:#00ffff;">[فجوة زمنية]: ${missingChar}</div>`;
        display.scrollTop = display.scrollHeight;
    }
    lastHValue = currentHValue;
});

// ب. استقبال نظام الكتل (إعادة بناء الملفات)
onValue(pulseRef, (snapshot) => {
    const display = document.getElementById("chat-display");
    if (!snapshot.exists()) return;
    const pulses = Object.values(snapshot.val());
    const groups = {};
    pulses.forEach(p => {
        if(!groups[p.id]) groups[p.id] = { type: p.t, mime: p.m, chunks: [] };
        const original = p.d.map(b => b ^ 0x0F);
        groups[p.id].chunks.push({ idx: p.idx, data: original });
    });
    Object.keys(groups).sort().forEach(id => {
        const group = groups[id];
        group.chunks.sort((a, b) => a.idx - b.idx);
        let totalLength = group.chunks.reduce((acc, c) => acc + c.data.length, 0);
        const finalArray = new Uint8Array(totalLength);
        let offset = 0;
        group.chunks.forEach(c => { finalArray.set(c.data, offset); offset += c.data.length; });
        const container = document.createElement("div");
        container.style.borderBottom = "1px dotted #111";
        if (group.type === "text") {
            container.textContent = machineDecoder.decode(finalArray);
        } else {
            const blob = new Blob([finalArray], { type: group.mime });
            const url = URL.createObjectURL(blob);
            if (group.mime.startsWith("image/")) {
                const img = document.createElement("img"); img.src = url; container.appendChild(img);
            } else {
                container.innerHTML = `<a href="${url}" download="file_${id}" style="color:#0f0;">📂 ملف مستعاد</a>`;
            }
        }
        display.appendChild(container);
    });
    display.scrollTop = display.scrollHeight;
});

document.getElementById("clearBtn").onclick = () => { 
    if(confirm("تصفير كافة الأنظمة؟")) { remove(pulseRef); remove(heartbeatRef); }
};
