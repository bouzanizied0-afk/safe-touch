// إدارة الشبكة اللامركزية P2P - نسخة Chat Pro المطورة
export class P2PNetwork {
    constructor(onMessageReceived) {
        // إنشاء اتصال PeerJS مع إعدادات تلقائية لخوادم STUN لجلب الـ IP
        this.peer = new Peer(); 
        this.conn = null;
        this.onMessage = onMessageReceived;
    }

    // تشغيل العقدة والحصول على الـ ID
    init(onIdReady) {
        this.peer.on('open', (id) => onIdReady(id));

        // الاستماع للاتصالات القادمة (مثل استقبال مكالمة)
        this.peer.on('connection', (c) => {
            this.conn = c;
            console.log("تم الاتصال بواسطة طرف خارجي 🔗");
            this._setupListeners();
        });

        // التعامل مع أخطاء الشبكة
        this.peer.on('error', (err) => {
            console.error("خطأ في الشبكة P2P:", err.type);
            this.onMessage({ type: 'system', text: "حدث خطأ في الاتصال: " + err.type });
        });
    }

    // محاولة الربط مع طرف آخر (تونس <-> أمريكا)
    connect(peerId) {
        if (!peerId) return;
        this.conn = this.peer.connect(peerId, {
            reliable: true // ضمان وصول الرسائل بالترتيب الصحيح
        });
        this._setupListeners();
    }

    // إعداد مستمعي البيانات داخل النفق المشفر
    _setupListeners() {
        if (!this.conn) return;

        this.conn.on('open', () => {
            console.log("نفق البيانات مفتوح الآن 🟢");
            this.onMessage({ type: 'system', text: "تم الربط بنجاح! 🟢" });
        });

        this.conn.on('data', (data) => {
            // هنا نستقبل الكائنات (Objects) ونمررها للواجهة
            this.onMessage(data);
        });

        this.conn.on('close', () => {
            this.onMessage({ type: 'system', text: "انقطع الاتصال بالطرف الآخر 🔴" });
        });
    }

    /**
     * إرسال البيانات (رسائل دردشة أو تنبيهات نظام)
     * @param {Object} dataObject - { type: 'chat', text: '...' }
     */
    sendData(dataObject) {
        if (this.conn && this.conn.open) {
            this.conn.send(dataObject);
        } else {
            console.warn("محاولة إرسال فاشلة: لا يوجد اتصال نشط.");
            this.onMessage({ type: 'system', text: "فشل الإرسال: العقدة غير متصلة! ❌" });
        }
    }
}
