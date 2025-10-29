import OpenAI from "openai";

// إنشاء عميل OpenAI باستخدام المفتاح البيئي
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// دالة المعالجة الأساسية
export default async function handler(req, res) {
  if (req.method !== "POST") {
    // رفض أي طلب غير POST
    return res.status(405).json({ error: "الطريقة غير مسموحة. استخدم POST فقط." });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "الرجاء رفع صورة للتحليل." });
    }

    // إرسال الصورة إلى نموذج GPT-4o-mini لتحليلها
    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "حلل محتوى هذه الصورة وصفاً ميدانياً تنفيذياً:" },
            { type: "image_url", image_url: image },
          ],
        },
      ],
    });

    // إرجاع النتيجة كـ JSON
    res.status(200).json({ result: result.choices[0].message.content });
  } catch (err) {
    console.error("خطأ في التحليل:", err);
    res.status(500).json({ error: "حدث خطأ أثناء التحليل." });
  }
}
