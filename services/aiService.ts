
import { GoogleGenAI, Type } from "@google/genai";
import { db } from "./db";

export const aiService = {
  // تحليل الأوامر الصوتية
  async processVoiceCommand(base64Audio: string) {
    try {
      // Corrected initialization to strictly follow Gemini SDK guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const products = db.getProducts();

      const prompt = `
        أنت مساعد كاشير ذكي. قمت بتلقي أمر صوتي. 
        حلل الكلام ونفذ أحد الأفعال التالية بصيغة JSON:
        1. ADD_ITEM: إذا طلب إضافة منتج (ارجع الباركود).
        2. CHECK_PRICE: إذا سأل عن سعر (ارجع اسم المنتج).
        3. CHECK_STOCK: إذا سأل عن الكمية (ارجع اسم المنتج).

        قائمة المنتجات المتاحة: ${JSON.stringify(products.map(p => ({name: p.name, barcode: p.barcode, price: p.sell_price})))}

        الرد يجب أن يكون JSON فقط مثل: {"action": "ADD_ITEM", "barcode": "123"}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
            { text: prompt }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Voice Error:", error);
      return null;
    }
  },

  // التنبؤ بالمخزون
  async getInventoryForecast() {
    try {
      // Corrected initialization to strictly follow Gemini SDK guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const products = db.getProducts();
      const saleItems = db.getSaleItems();

      const prompt = `
        بناءً على قائمة المبيعات والمنتجات التالية، حدد أهم 3 منتجات معرضة للنفاذ قريباً بناءً على سرعة سحبها وتاريخ اليوم.
        المنتجات: ${JSON.stringify(products.slice(0, 50))}
        المبيعات الأخيرة: ${JSON.stringify(saleItems.slice(-50))}
        
        أرجع النتيجة كقائمة نصية قصيرة جداً ومقنعة لصاحب المحل باللغة العربية.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }]
      });

      return response.text;
    } catch (error) {
      console.error("Inventory Forecast Error:", error);
      return "لا توجد توقعات حالياً.";
    }
  },

  // تحليل أعمال ذكي
  async getBusinessInsights() {
    try {
      // Corrected initialization to strictly follow Gemini SDK guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const report = db.getReport();
      
      const prompt = `
        أنت مستشار أعمال خبير. قم بتحليل تقرير مبيعات اليوم لمتجر "سوبر ماركت نبيل" وقدم نصيحة واحدة ذكية ومختصرة جداً لتحسين الربحية بناءً على البيانات التالية:
        
        البيانات المالية لليوم:
        - إجمالي المبيعات: ${report.todaySales} ₪
        - صافي الربح اليومي: ${report.netProfit} ₪
        - إجمالي المصاريف: ${report.todayExpenses} ₪
        - الديون المستحقة على الزبائن: ${report.totalReceivables} ₪
        
        قدم النصيحة باللغة العربية باختصار شديد.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }]
      });

      return response.text;
    } catch (error) {
      console.error("AI Insights Error:", error);
      return "تعذر الحصول على نصيحة في الوقت الحالي.";
    }
  }
};
