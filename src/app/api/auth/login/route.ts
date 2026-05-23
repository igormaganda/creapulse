import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateAuthResponse, verifyPassword } from '@/lib/auth'
import { success, Errors, handleApiError } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Errors.validation({ email: ['Email requis'], password: ['Mot de passe requis'] }, 'Champs manquants')
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!user) {
      return Errors.invalidCredentials('Aucun compte trouvé avec cet email')
    }

    if (!user.password) {
      return Errors.invalidCredentials('Méthode de connexion invalide')
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return Errors.invalidCredentials('Mot de passe incorrect')
    }

    // Get tenant ID
    let tenantId = 'default'
    if (user.tenantId) {
      const tenant = await db.tenant.findUnique({ where: { id: user.tenantId } })
    }

    // Generate auth tokens
    const authTokens = await generateAuthResponse({
      id: user.id,
      tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    })

    // Set session cookie
    const sessionCookie = `session=${authTokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${authTokens.expiresIn}`

    return NextResponse.json({
      success: true,
      data: {
        user: authTokens.user,
        accessToken: authTokens.accessToken,
      },
    }, {
 headers: {
        'Set-Cookie': sessionCookie,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
