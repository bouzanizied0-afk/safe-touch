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

// المسارات المطورة
const syncRef = ref(db, "time/sync");
const structuredRef = ref(db, "temporal/v3_structured"); // المسار الجديد المنظم
const heartbeatRef = ref(db, "temporal/heartbeat");

// خريطة الرموز الرقمية (Direct Mapping)
const TYPE_MAP = { "text": 1001, "image": 465586, "file": 9909 };
let sessionId = Math.floor(Math.random() * 9000) + 1000; 

const machineEncoder = new TextEncoder();
const machineDecoder = new TextDecoder();

// --- 2. محرك الضغط الأقصى (Compression Logic) ---
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

// --- 4. محرك الإرسال المتسلسل (الضغط + الترقيم) ---
async function sendStructuredData(rawData, type) {
    const compressed = await compressData(rawData);
    const CHUNK_SIZE = 64 * 1024; // قطع كبيرة 64KB لتقليل عدد الملفات
    const totalChunks = Math.ceil(compressed.length / CHUNK_SIZE);
    const typeCode = TYPE_MAP[type] || 0;

    for (let i = 0; i < totalChunks; i++) {
        const chunk = compressed.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const obfuscated = Array.from(chunk).map(b => b ^ 0x0F);
        
        // الترقيم الذي طلبته: SessionID_Index
        const sequenceId = `${sessionId}_${i}`;
        
        await set(ref(db, `temporal/v3_structured/${sequenceId}`), {
            d: obfuscated,
            t: typeCode,
            total: totalChunks,
            ts: serverTimestamp()
        });
    }
    sessionId++; 
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
    sendBySuppression(val); // نظام الفجوة
    sendStructuredData(machineEncoder.encode(val), "text"); // نظام الكتل المتسلسل
    document.getElementById("userInput").value = "";
};

document.getElementById("fileBtn").onclick = () => {
    const input = document.createElement('input'); 
    input.type = 'file';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = (evt) => { 
            sendStructuredData(new Uint8Array(evt.target.result), "image"); 
        };
        reader.readAsArrayBuffer(e.target.files[0]);
    };
    input.click();
};

// --- 6. محرك الاستقبال وإعادة التجميع الذكي ---
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

// ب. استقبال الكتل المتسلسلة وفك الضغط
onValue(structuredRef, async (snapshot) => {
    const display = document.getElementById("chat-display");
    if (!snapshot.exists()) return;
    
    const data = snapshot.val();
    Object.keys(data).forEach(key => {
        const [sId, cIdx] = key.split("_");
        if (!receivedChunks[sId]) {
            receivedChunks[sId] = { chunks: [], total: data[key].total, type: data[key].t };
        }
        const original = data[key].d.map(b => b ^ 0x0F);
        receivedChunks[sId].chunks[parseInt(cIdx)] = original;
    });

    for (let sId in receivedChunks) {
        const session = receivedChunks[sId];
        const currentCount = session.chunks.filter(n => n !== undefined).length;

        if (currentCount === session.total) {
            // تجميع القطع
            let totalLength = session.chunks.reduce((acc, c) => acc + c.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            session.chunks.forEach(c => { combined.set(c, offset); offset += c.length; });

            // فك الضغط والمعالجة
            const finalData = await decompressData(combined);
            const container = document.createElement("div");
            container.style.borderBottom = "1px dotted #333";

            if (session.type === 1001) {
                container.textContent = machineDecoder.decode(finalData);
            } else if (session.type === 465586) {
                const url = URL.createObjectURL(new Blob([finalData]));
                container.innerHTML = `<img src="${url}" style="max-width:200px; border:1px solid #0f0;">`;
            }
            display.appendChild(container);
            delete receivedChunks[sId]; // مسح الذاكرة المؤقتة
            display.scrollTop = display.scrollHeight;
        }
    }
});

document.getElementById("clearBtn").onclick = () => { 
    if(confirm("تصفير الأنظمة؟")) { remove(structuredRef); remove(heartbeatRef); }
};
