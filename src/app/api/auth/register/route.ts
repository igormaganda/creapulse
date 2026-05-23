import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caracteres' },
        { status: 400 }
      )
    }

    // TODO: Replace with real registration logic (hash password, create user in Prisma)
    // For now, return a mock user for demonstration
    return NextResponse.json({
      user: {
        id: 'demo-user-id',
        firstName,
        lastName,
        email,
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
