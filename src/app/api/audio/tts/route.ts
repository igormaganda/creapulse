import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text: string = body.text ?? "";
    const voice: string = body.voice || "tongtong";
    const speed: number = body.speed ?? 1.0;

    const trimmed = text.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Text is required and must not be empty." },
        { status: 400 },
      );
    }

    const input = trimmed.slice(0, 1024);

    // Dynamic import to avoid issues with serverless cold starts
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input,
      voice,
      speed,
      response_format: "mp3",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Derive a content hash from the input parameters for cache-keying
    const hash = crypto
      .createHash("sha256")
      .update(`${input}|${voice}|${speed}`)
      .digest("hex");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Hash": hash,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // Browser SpeechSynthesis fallback check — no auth required (public utility)
  return NextResponse.json({
    browserTtsAvailable: true,
    serverTtsAvailable: true,
  });
}