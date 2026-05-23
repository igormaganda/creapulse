import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Veuillez saisir votre e-mail et votre mot de passe' },
        { status: 400 }
      )
    }

    // TODO: Replace with real authentication logic (NextAuth / Prisma)
    // For now, return a mock user for demonstration
    return NextResponse.json({
      user: {
        id: 'demo-user-id',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: email,
        role: 'BENEFICIARY',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
