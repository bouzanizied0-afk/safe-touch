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

// المسارات المطورة (تم الانتقال إلى نظام التدفق الزمني)
const syncRef = ref(db, "time/sync");
const streamRef = ref(db, "temporal/stream"); 
const heartbeatRef = ref(db, "temporal/heartbeat");

// الترددات الرقمية (بدل المصطلحات النصية)
const TYPE_MAP = { "text": 1001, "image": 465586, "file": 9909 };
let sessionId = Math.floor(Math.random() * 9000) + 1000; 

const machineEncoder = new TextEncoder();
const machineDecoder = new TextDecoder();

// --- 2. محرك الضغط الأقصى ---
async function compressData(data) {
    const stream = new Blob([data]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
    const response = new Response(compressedStream);
    return new Uint8Array(await response.arrayBuffer());
}

async function decompressData(data) {
    const stream = new Blob([data]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
    const response = new Response(decompressedStream);
    return new Uint8Array(await response.arrayBuffer());
}

// --- 3. المزامنة والعداد الدوري (نظام الحذف) ---
let currentTick = 0;
let counter = 1;
let suppressedValue = null; 

onValue(syncRef, snap => { 
    if(snap.exists()) currentTick = snap.val(); 
    document.getElementById("global-tick").textContent = currentTick; 
    document.getElementById("status").textContent = "نظام النبض المزدوج نشط 🟢";
});

setInterval(() => {
    if (counter > 255) counter = 1;
    if (counter === suppressedValue) {
        suppressedValue = null; 
    } else {
        set(heartbeatRef, counter);
    }
    counter++;
}, 150);

setInterval(() => { set(syncRef, (currentTick % 10) + 1); }, 1000);

// --- 4. محرك الإرسال (لغة النبضة المحضة) ---
async function sendPulseStream(rawData, frequencyCode) {
    const compressed = await compressData(rawData);
    const CHUNK_SIZE = 64 * 1024; // قطع كبيرة 64KB لتقليل عدد الملفات
    const totalChunks = Math.ceil(compressed.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
        const chunk = compressed.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const obfuscated = Array.from(chunk).map(b => b ^ 0x0F);
        
        // المسار الرقمي الزمني: التردد / طابع الجلسة_الترتيب
        const pulsePath = `${frequencyCode}/${Date.now()}_${i}`;
        
        await set(ref(db, `temporal/stream/${pulsePath}`), {
            d: obfuscated,
            total: totalChunks // النبضة الحاملة للعدد الكلي
        });
    }
}

// دالة الحذف للنصوص السريعة
function sendBySuppression(text) {
    text.split("").forEach((char, index) => {
        setTimeout(() => { suppressedValue = char.charCodeAt(0); }, index * 1200);
    });
}

// --- 5. أزرار الواجهة ---
document.getElementById("sendBtn").onclick = () => {
    const val = document.getElementById("userInput").value;
    if(!val) return;
    sendBySuppression(val); 
    sendPulseStream(machineEncoder.encode(val), TYPE_MAP["text"]); 
    document.getElementById("userInput").value = "";
};

document.getElementById("fileBtn").onclick = () => {
    const input = document.createElement('input'); 
    input.type = 'file';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = (evt) => { 
            sendPulseStream(new Uint8Array(evt.target.result), TYPE_MAP["image"]); 
        };
        reader.readAsArrayBuffer(e.target.files[0]);
    };
    input.click();
};

// --- 6. محرك الاستقبال وإعادة التجميع الزمني ---
let receivedChunks = {};

// أ. استقبال نظام الحذف
let lastHValue = 0;
onValue(heartbeatRef, (snapshot) => {
    const currentHValue = snapshot.val();
    if (currentHValue === lastHValue + 2 || (currentHValue === 1 && lastHValue === 254)) {
        const missingChar = String.fromCharCode(lastHValue + 1);
        document.getElementById("chat-display").innerHTML += `<div style="color:#00ffff;">[فجوة]: ${missingChar}</div>`;
    }
    lastHValue = currentHValue;
});

// ب. استقبال دفق الترددات (stream)
onValue(streamRef, async (snapshot) => {
    const display = document.getElementById("chat-display");
    if (!snapshot.exists()) return;
    
    const frequencies = snapshot.val(); // الترددات المتاحة في السيرفر

    for (let fCode in frequencies) {
        const pulses = frequencies[fCode];
        const keys = Object.keys(pulses).sort(); // الترتيب الزمني للنبضات
        
        // جلب الإجمالي من أول نبضة متاحة
        const totalNeeded = pulses[keys[0]].total;

        if (keys.length === totalNeeded) {
            let combinedArray = [];
            keys.forEach(k => {
                const original = pulses[k].d.map(b => b ^ 0x0F);
                combinedArray.push(new Uint8Array(original));
            });

            // تجميع الدفق
            let merged = new Uint8Array(combinedArray.reduce((acc, curr) => acc + curr.length, 0));
            let offset = 0;
            combinedArray.forEach(chunk => { merged.set(chunk, offset); offset += chunk.length; });

            // فك الضغط والمعالجة بلغة التردد
            const finalData = await decompressData(merged);
            const container = document.createElement("div");
            container.style.borderBottom = "1px dotted #333";

            if (parseInt(fCode) === 1001) {
                container.textContent = machineDecoder.decode(finalData);
            } else if (parseInt(fCode) === 465586) {
                const url = URL.createObjectURL(new Blob([finalData]));
                container.innerHTML = `<img src="${url}" style="max-width:200px; border:1px solid #0f0;">`;
            }
            display.appendChild(container);
            
            // تنظيف التردد من السيرفر فور الاكتمال
            remove(ref(db, `temporal/stream/${fCode}`));
            display.scrollTop = display.scrollHeight;
        }
    }
});

document.getElementById("clearBtn").onclick = () => { 
    if(confirm("تصفير كافة الترددات؟")) { remove(streamRef); remove(heartbeatRef); }
};
