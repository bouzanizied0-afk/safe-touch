// محرك التحليل السلوكي المستقل
export class BehavioralEngine {
    constructor() {
        this.threshold = 3.5; 
        this.model = { avgVelocity: 0, count: 0 };
    }

    // تحليل اللمسة الجديدة
    analyze(duration, pressure) {
        const velocity = 1000 / duration;
        
        if (this.model.count < 5) {
            // مرحلة التعلم
            this.model.avgVelocity = (this.model.avgVelocity * this.model.count + velocity) / (this.model.count + 1);
            this.model.count++;
            return { ok: true, learning: true };
        } else {
            // مرحلة التحقق
            const diff = Math.abs(this.model.avgVelocity - velocity);
            const isMatch = diff < this.threshold;
            
            // تحديث النموذج ببطء ليتكيف مع تعب يد المستخدم
            if (isMatch) {
                this.model.avgVelocity = (0.1 * velocity) + (0.9 * this.model.avgVelocity);
            }
            
            return { ok: isMatch, learning: false, score: diff };
        }
    }
}
