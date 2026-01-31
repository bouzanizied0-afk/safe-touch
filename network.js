// ملف إدارة الشبكة اللامركزية P2P
export class P2PNetwork {
    constructor(onMessageReceived) {
        this.peer = new Peer();
        this.conn = null;
        this.onMessage = onMessageReceived;
    }

    // ابدأ الشبكة واحصل على المعرف الخاص بك
    init(onIdReady) {
        this.peer.on('open', (id) => onIdReady(id));
        this.peer.on('connection', (c) => {
            this.conn = c;
            this.listen();
        });
    }

    // الاتصال بجهاز آخر
    connect(peerId) {
        this.conn = this.peer.connect(peerId);
        this.listen();
    }

    // الاستماع للرسائل القادمة (التصويت)
    listen() {
        if (!this.conn) return;
        this.conn.on('data', (data) => {
            this.onMessage(data);
        });
    }

    // إرسال نتيجة التحقق السلوكي
    sendValidation(status) {
        if (this.conn && this.conn.open) {
            this.conn.send(status);
        }
    }
}
