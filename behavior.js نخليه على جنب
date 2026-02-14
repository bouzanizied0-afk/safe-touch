export class BehavioralEngine {
    constructor() {
        this.samples = [];
        this.isTrained = false;
        this.mean = 0;
        this.stdDev = 0;
        this.failureCount = 0; // عداد المحاولات الفاشلة
    }

    analyze(duration) {
        // التحليل الآن يعتمد على "التنميط الذاتي" لكل جهاز على حدة
        if (!this.isTrained) {
            return this._performTraining(duration);
        } else {
            return this._performVerification(duration);
        }
    }

    _performTraining(duration) {
        this.samples.push(duration);
        if (this.samples.length >= 5) {
            this.mean = this.samples.reduce((a, b) => a + b) / this.samples.length;
            const variance = this.samples.reduce((sq, n) => sq + Math.pow(n - this.mean, 2), 0) / this.samples.length;
            this.stdDev = Math.sqrt(variance);
            this.isTrained = true;
            return { ok: true, learning: true, count: 5, status: 'trained' };
        }
        return { ok: true, learning: true, count: this.samples.length, status: 'collecting' };
    }

    _performVerification(duration) {
        const diff = Math.abs(duration - this.mean);
        
        /**
         * تحديث تقني: الهامش الديناميكي أصبح "مطاطياً" 
         * ليناسب اختلاف استجابة الشاشات (آيفون، أندرويد، حاسوب)
         * رفعنا المعامل إلى 3.5 لضمان عدم رفض المستخدم الحقيقي بسبب لاغ (Lag) الشبكة
         */
        let dynamicThreshold = Math.max(this.stdDev * 3.5, 50); 

        const isMatch = diff <= dynamicThreshold;

        if (isMatch) {
            // إعادة ضبط عداد الفشل عند النجاح
            this.failureCount = 0; 
            
            /**
             * التكيف المستمر (Reinforcement Learning)
             * جعلنا التعلم بنسبة 20% (0.2) بدلاً من 10% لسرعة التأقلم 
             * مع اختلاف الأجهزة عند التنقل بينها.
             */
            this.mean = (this.mean * 0.8) + (duration * 0.2);
            this.stdDev = (this.stdDev * 0.9) + (Math.abs(duration - this.mean) * 0.1);
            
            return { ok: true, learning: false };
        } else {
            // زيادة عداد الفشل عند الخطأ
            this.failureCount++;
            
            // --- استراتيجية الدفاع ضد الاختراق ---
            if (this.failureCount >= 3) {
                // تشديد الأمان بنسبة 50% بعد 3 أخطاء
                this.stdDev *= 0.5; 
                return { 
                    ok: false, 
                    status: 'locked', 
                    message: "تم اكتشاف نشاط مشبوه! تم رفع مستوى الحماية." 
                };
            }
            
            return { ok: false, learning: false };
        }
    }
}
