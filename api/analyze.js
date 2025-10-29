import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "الطريقة غير مسموحة. استخدم POST فقط." });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "الرجاء رفع صورة للتحليل." });
    }

    const prompt = `
    قم بتحليل الصورة التالية كأنك مهندس ميداني في أمانة مكة.
    استخرج العناصر التالية إن وُجدت، ووصف حالتها التنفيذية بدقة:
    - الطرق (تشققات، حفر، طلاء الخطوط)
    - الأرصفة (تلف، استقامة، طلاء)
    - الإنارة (إضاءة، ميل، تلف)
    - الأشجار والمسطحات (صحة، ري، تقليم)
    - اللوحات الإعلانية / المرورية (وضوح، ميل، ضرر)
    - الحاويات والنظافة العامة
    - التشوهات البصرية أو أي عناصر غير مطابقة.

    أعد الإجابة بصيغة JSON منظمة كما يلي:

    {
      "العناصر": [
        {"الفئة": "الأرصفة", "الوصف": "تلف بسيط ودهان قديم", "الأولوية": "متوسطة"},
        {"الفئة": "الإنارة", "الوصف": "عمود إنارة مائل جزئياً", "الأولوية": "عاجلة"}
      ],
      "التوصية العامة": "تحتاج المنطقة إلى صيانة شاملة خلال 72 ساعة وتحسين مستوى النظافة."
    }
    `;

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت مهندس جودة ميداني متخصص في التحليل البلدي الذكي." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: image },
          ],
        },
      ],
      temperature: 0.3,
    });

    res.status(200).json({ result: result.choices[0].message.content });
  } catch (err) {
    console.error("خطأ أثناء التحليل:", err);
    res.status(500).json({ error: "حدث خطأ أثناء التحليل." });
  }
}
