import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[ai/chat]";

const SYSTEM_PROMPT = `أنت مساعد ذكي متخصص في إدارة الأعمال والموارد البشرية لشركة Blumark24.
تتحدث باللغة العربية فقط وتقدم تحليلات دقيقة ومفيدة بناءً على بيانات الشركة الحقيقية.
كن مختصراً وعملياً في إجاباتك. استخدم التنسيق بـ ** للنصوص المهمة والـ - لنقاط القوائم.`;

interface KPIContext {
  activeClients: number;
  completedTasksPct: number;
  incompleteTasks: number;
  netProfit: number;
  overdueTasks?: number;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    console.warn(`${TAG} ANTHROPIC_API_KEY not set — returning 503`);
    return NextResponse.json(
      { error: "AI_KEY_MISSING", message: "مفتاح الذكاء الاصطناعي غير مضبوط" },
      { status: 503 },
    );
  }

  let body: { message?: string; kpi?: KPIContext };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const userMessage = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  if (!userMessage) {
    return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
  }

  const kpi = body.kpi;
  const kpiContext = kpi
    ? `\n\n**بيانات الشركة الحالية:**\n- العملاء النشطون: ${kpi.activeClients}\n- معدل إتمام المهام: ${kpi.completedTasksPct}%\n- المهام غير المكتملة: ${kpi.incompleteTasks}\n- المهام المتأخرة: ${kpi.overdueTasks ?? 0}\n- صافي الربح: ${kpi.netProfit.toLocaleString("ar-SA")} ريال`
    : "";

  const client = new Anthropic({ apiKey });

  try {
    console.log(`${TAG} streaming request | msg_len=${userMessage.length}`);

    const stream = await client.messages.stream({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:     SYSTEM_PROMPT + kpiContext,
      messages:   [{ role: "user", content: userMessage }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type":  "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${TAG} Anthropic error: ${msg}`);
    return NextResponse.json(
      { error: "AI_ERROR", message: msg },
      { status: 502 },
    );
  }
}
