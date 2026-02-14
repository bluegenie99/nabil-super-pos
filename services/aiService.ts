
import { GoogleGenAI } from "@google/genai";
import { db } from "./db";

export const aiService = {
  // فحص هل المفتاح متوفر
  hasKey: () => {
    return !!process.env.API_KEY && process.env.API_KEY !== "undefined" && process.env.API_KEY.length > 10;
  },

  // تحليل أعمال ذكي
  async getBusinessInsights() {
    if (!this.hasKey()) {
      return "يرجى إضافة مفتاح Gemini API في إعدادات Vercel لتفعيل المستشار الذكي.";
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const report = db.getReport();
      
      const prompt = `
        أنت مستشار أعمال خبير بلهجة فلسطينية محببة. قم بتحليل تقرير مبيعات اليوم لمتجر "سوبر ماركت نبيل" وقدم نصيحة واحدة ذكية ومختصرة جداً لتحسين الربحية بناءً على البيانات التالية:
        
        البيانات المالية لليوم:
        - إجمالي المبيعات: ${report.todaySales} ₪
        - صافي الربح اليومي: ${report.netProfit} ₪
        - إجمالي المصاريف: ${report.todayExpenses} ₪
        - الديون المستحقة على الزبائن: ${report.totalReceivables} ₪
        
        قدم النصيحة باللغة العربية باختصار شديد.
      `;

      // Use gemini-3-pro-preview for complex reasoning tasks like business analysis.
      // Use direct string for contents as per guidelines for basic text prompts.
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      return response.text || "لم أستطع تحليل البيانات حالياً، حاول لاحقاً.";
    } catch (error: any) {
      console.error("AI Insights Error:", error);
      if (error.message?.includes("API_KEY_INVALID")) return "خطأ: مفتاح API غير صحيح.";
      return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
    }
  },

  // التنبؤ بالمخزون
  async getInventoryForecast() {
    if (!this.hasKey()) return "توقعات المخزون تتطلب تفعيل الذكاء الاصطناعي.";
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const products = db.getProducts();

      const prompt = `
        حلل حركة المخزون لمتجر نبيل وحدد أهم أصناف يجب طلبها قريباً.
        المنتجات: ${JSON.stringify(products.slice(0, 30))}
        أرجع النتيجة باختصار شديد (3 أصناف فقط).
      `;

      // Use gemini-3-pro-preview for inventory forecasting which involves reasoning.
      // Use direct string for contents as per guidelines for basic text prompts.
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      return response.text || "لا توجد توقعات حالياً.";
    } catch (error) {
      return "لا توجد توقعات حالياً.";
    }
  }
};
