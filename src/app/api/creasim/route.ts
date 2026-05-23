// ============================================
// CreaPulse V2 — CreaSim Financial Simulator API
// GET  /api/creasim  — Retrieve saved simulation
// POST /api/creasim  — Save / update simulation (upsert)
// PUT  /api/creasim  — Alias for POST
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

// ─── Validation Schema ───────────────────────

const creasimSchema = z.object({
  monthlyRevenue: z.number().min(0).optional(),
  fixedCharges: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      amount: z.number().min(0),
    })
  ).optional(),
  variableChargesRate: z.number().min(0).max(100).optional(),
  averageSellingPrice: z.number().min(0).optional(),
  unitCost: z.number().min(0).optional(),
  initialInvestment: z.number().min(0).optional(),
  targetMarginRate: z.number().min(0).max(100).optional(),
  // Calculated outputs (from frontend)
  fixedChargesTotal: z.number().min(0).optional(),
  variableChargesAmount: z.number().min(0).optional(),
  totalCharges: z.number().min(0).optional(),
  grossMarginAmount: z.number().optional(),
  grossMarginRate: z.number().optional(),
  netMarginAmount: z.number().optional(),
  netMarginRate: z.number().optional(),
  monthlyBreakeven: z.number().optional(),
  breakevenMonths: z.number().optional(),
  profitability1Y: z.number().optional(),
  profitability2Y: z.number().optional(),
  profitability3Y: z.number().optional(),
  year1Revenue: z.number().optional(),
  year1Expenses: z.number().optional(),
  year2Revenue: z.number().optional(),
  year2Expenses: z.number().optional(),
  year3Revenue: z.number().optional(),
  year3Expenses: z.number().optional(),
  aiAnalysis: z.string().optional(),
}).passthrough() // Allow extra fields without error

// ─── Auth helper ─────────────────────────────

async function authenticate(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const authHeader = request.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!token) {
    return null
  }

  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

// ─── GET: Retrieve simulation ────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }

    const simulation = await db.creaSimSimulation.findUnique({
      where: { userId: payload.userId },
    })

    if (!simulation) {
      return success(null, 'Aucune simulation sauvegardée')
    }

    return success(simulation, 'Simulation chargée')
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée')
      }
    }
    return handleApiError(err)
  }
}

// ─── POST: Save / Update simulation ──────────

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }

    const body = await request.json()
    const parsed = creasimSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      )
    }

    const data = parsed.data

    // Build the data object for upsert
    const simData = {
      userId: payload.userId,
      // Simulator inputs
      monthlyRevenue: data.monthlyRevenue ?? undefined,
      fixedCharges: data.fixedCharges != null
        ? (data.fixedCharges as unknown as Prisma.InputJsonValue)
        : undefined,
      variableChargesRate: data.variableChargesRate ?? undefined,
      averageSellingPrice: data.averageSellingPrice ?? undefined,
      unitCost: data.unitCost ?? undefined,
      targetMarginRate: data.targetMarginRate ?? undefined,
      initialInvestment: data.initialInvestment ?? undefined,
      // Calculated outputs
      fixedChargesTotal: data.fixedChargesTotal ?? undefined,
      variableChargesAmount: data.variableChargesAmount ?? undefined,
      totalCharges: data.totalCharges ?? undefined,
      grossMarginAmount: data.grossMarginAmount ?? undefined,
      grossMarginRate: data.grossMarginRate ?? undefined,
      netMarginAmount: data.netMarginAmount ?? undefined,
      netMarginRate: data.netMarginRate ?? undefined,
      monthlyBreakeven: data.monthlyBreakeven ?? undefined,
      breakevenMonths: data.breakevenMonths ?? undefined,
      profitability1Y: data.profitability1Y ?? undefined,
      profitability2Y: data.profitability2Y ?? undefined,
      profitability3Y: data.profitability3Y ?? undefined,
      // Yearly projections
      year1Revenue: data.year1Revenue ?? undefined,
      year1Expenses: data.year1Expenses ?? undefined,
      year2Revenue: data.year2Revenue ?? undefined,
      year2Expenses: data.year2Expenses ?? undefined,
      year3Revenue: data.year3Revenue ?? undefined,
      year3Expenses: data.year3Expenses ?? undefined,
      aiAnalysis: data.aiAnalysis ?? undefined,
    }

    // Upsert the CreaSimSimulation
    const simulation = await db.creaSimSimulation.upsert({
      where: { userId: payload.userId },
      create: {
        ...simData,
        monthlyRevenue: simData.monthlyRevenue ?? null,
        fixedCharges: simData.fixedCharges ?? null,
        variableChargesRate: simData.variableChargesRate ?? null,
        averageSellingPrice: simData.averageSellingPrice ?? null,
        unitCost: simData.unitCost ?? null,
        targetMarginRate: simData.targetMarginRate ?? null,
        initialInvestment: simData.initialInvestment ?? null,
        fixedChargesTotal: simData.fixedChargesTotal ?? null,
        variableChargesAmount: simData.variableChargesAmount ?? null,
        totalCharges: simData.totalCharges ?? null,
        grossMarginAmount: simData.grossMarginAmount ?? null,
        grossMarginRate: simData.grossMarginRate ?? null,
        netMarginAmount: simData.netMarginAmount ?? null,
        netMarginRate: simData.netMarginRate ?? null,
        monthlyBreakeven: simData.monthlyBreakeven ?? null,
        breakevenMonths: simData.breakevenMonths ?? null,
        profitability1Y: simData.profitability1Y ?? null,
        profitability2Y: simData.profitability2Y ?? null,
        profitability3Y: simData.profitability3Y ?? null,
        year1Revenue: simData.year1Revenue ?? null,
        year1Expenses: simData.year1Expenses ?? null,
        year2Revenue: simData.year2Revenue ?? null,
        year2Expenses: simData.year2Expenses ?? null,
        year3Revenue: simData.year3Revenue ?? null,
        year3Expenses: simData.year3Expenses ?? null,
        aiAnalysis: simData.aiAnalysis ?? null,
      },
      update: simData,
    })

    return success(simulation, 'Simulation sauvegardée')
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée')
      }
    }
    return handleApiError(err)
  }
}

// ─── PUT: Alias for POST ─────────────────────

export async function PUT(request: NextRequest) {
  return POST(request)
}
