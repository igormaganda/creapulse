import { NextRequest, NextResponse } from 'next/server'

// ─── POST Handler — Server-side TTS fallback ──
// Uses z-ai-web-dev-sdk for speech synthesis when browser TTS is unavailable.
// Text is limited to 1024 characters per SDK constraint.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { text?: string; voice?: string }

    const { text, voice = 'tongtong' } = body

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_TEXT', message: 'Le texte est requis.' } },
        { status: 400 }
      )
    }

    // Truncate to 1024 chars (SDK limit)
    const truncatedText = text.trim().slice(0, 1024)

    // Import SDK dynamically (server-side only)
    const ZAI = await import('z-ai-web-dev-sdk').then((m) => m.default || m)
    const zai = await ZAI.create()

    const response = await zai.audio.tts.create({
      input: truncatedText,
      voice,
      speed: 1.0,
      response_format: 'wav',
      stream: false,
    })

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[TradEmploi TTS API] Error:', err)
    return NextResponse.json(
      { success: false, error: { code: 'TTS_ERROR', message: 'Erreur de synthèse vocale.' } },
      { status: 503 }
    )
  }
}