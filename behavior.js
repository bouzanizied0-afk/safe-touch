/**
 * محرك الذكاء السلوكي - إصدار Chat Pro المتقدم
 * يقوم هذا المحرك بتحليل "البصمة الزمنية" للمس وتحويلها إلى مفتاح أمان ديناميكي.
 */
export class BehavioralEngine {
    constructor() {
        this.samples = [];
        this.isTrained = false;
        this.mean = 0;
        this.stdDev = 0;
        this.minConfidence = 0.85; // نسبة الثقة المطلوبة (85%)
        this.historyLog = [];     // لتتبع تطور سلوكك عبر الزمن
    }

    /**
     * الوظيفة الأساسية: تحليل اللمسة ومقارنتها بالنموذج الرياضي
     * @param {number} duration - مدة اللمس بالملي ثانية
     */
    analyze(duration) {
        if (!this.isTrained) {
            return this._performTraining(duration);
        } else {
            return this._performVerification(duration);
        }
    }

    // --- العمليات الداخلية (Private-like methods) ---

    _performTraining(duration) {
        this.samples.push(duration);
        const progress = this.samples.length;

        if (progress >= 5) {
            this._buildMathematicalModel();
            return { ok: true, learning: true, count: progress, status: 'trained' };
        }
        
        return { ok: true, learning: true, count: progress, status: 'collecting' };
    }

    _buildMathematicalModel() {
        // 1. حساب المتوسط الحسابي (Mean)
        this.mean = this.samples.reduce((a, b) => a + b) / this.samples.length;

        // 2. حساب الانحراف المعياري (Standard Deviation)
        // هذا الرقم يمثل "مدى ثبات يدك"؛ كلما قل، زاد أمان النظام
        const variance = this.samples.reduce((sq, n) => sq + Math.pow(n - this.mean, 2), 0) / this.samples.length;
        this.stdDev = Math.sqrt(variance);

        this.isTrained = true;
        console.log(`%c [نظام الأمن] تمت عملية التدريب بنجاح. \nالمتوسط: ${this.mean.toFixed(2)}ms \nالانحراف: ${this.stdDev.toFixed(2)}ms`, "color: #4f46e5; font-weight: bold;");
    }

    _performVerification(duration) {
        // حساب المسافة الإحصائية (Z-Score)
        // هي تقنية تخبرنا كم تبعد هذه اللمسة عن "طبيعتك" بالنسبة لانحرافك المعياري
        const diff = Math.abs(duration - this.mean);
        
        // الهامش الديناميكي: 3 أضعاف الانحراف المعياري هو المعيار الذهبي علمياً
        const dynamicThreshold = Math.max(this.stdDev * 3, 40); 

        const isMatch = diff <= dynamicThreshold;

        if (isMatch) {
            // التكيف المستمر (Reinforcement Learning)
            // النظام يغير متوسطه بنسبة 10% مع كل لمسة صحيحة ليتواكب مع تغير مزاجك أو تعبك
            this.mean = (this.mean * 0.9) + (duration * 0.1);
            
            // تحديث الانحراف المعياري ببطء أيضاً لضمان استقرار النظام
            this.stdDev = (this.stdDev * 0.95) + (Math.abs(duration - this.mean) * 0.05);
            
            return { ok: true, learning: false, score: (1 - diff/dynamicThreshold).toFixed(2) };
        } else {
            return { ok: false, learning: false, score: 0 };
        }
    }
}
