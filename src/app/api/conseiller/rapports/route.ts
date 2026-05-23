import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'

// Mock report data
const monthlyData = {
  period: 'mois',
  kpis: {
    entretiensRealises: 16,
    beneficiairesActifs: 24,
    livrablesValides: 8,
    progressionMoyenne: 62,
  },
  entretiensParMois: [
    { month: 'Sep', count: 12 },
    { month: 'Oct', count: 18 },
    { month: 'Nov', count: 15 },
    { month: 'Dec', count: 10 },
    { month: 'Jan', count: 22 },
    { month: 'Fev', count: 16 },
  ],
  repartitionStatut: [
    { name: 'Ideation', value: 6, color: '#F59E0B' },
    { name: 'Structuration', value: 8, color: '#00838F' },
    { name: 'Financement', value: 5, color: '#FF6B35' },
    { name: 'Lancement', value: 3, color: '#059669' },
    { name: 'Developpement', value: 2, color: '#7C3AED' },
  ],
  progressionMoyenne: [
    { month: 'Sep', moyenne: 42 },
    { month: 'Oct', moyenne: 48 },
    { month: 'Nov', moyenne: 52 },
    { month: 'Dec', moyenne: 55 },
    { month: 'Jan', moyenne: 58 },
    { month: 'Fev', moyenne: 62 },
  ],
  topBeneficiaires: [
    { id: 'b1', name: 'Amadou Diallo', initials: 'AD', progress: 85, lastActivity: 'Il y a 2 jours', status: 'Lancement' },
    { id: 'b2', name: 'Lea Fontaine', initials: 'LF', progress: 78, lastActivity: 'Hier', status: 'Structuration' },
    { id: 'b4', name: 'Clara Dubois', initials: 'CD', progress: 72, lastActivity: 'Il y a 3 jours', status: 'Financement' },
    { id: 'b8', name: 'Fatima Hassani', initials: 'FH', progress: 68, lastActivity: "Aujourd'hui", status: 'Structuration' },
    { id: 'b5', name: 'Karim Benali', initials: 'KB', progress: 65, lastActivity: 'Il y a 5 jours', status: 'Lancement' },
    { id: 'b10', name: 'Nadia Bouzid', initials: 'NB', progress: 60, lastActivity: 'Il y a 1 jour', status: 'Structuration' },
    { id: 'b3', name: 'Marc Renaud', initials: 'MR', progress: 55, lastActivity: 'Il y a 4 jours', status: 'Ideation' },
    { id: 'b7', name: 'Thomas Leroy', initials: 'TL', progress: 48, lastActivity: 'Il y a 1 semaine', status: 'Ideation' },
  ],
}

const quarterlyData = {
  period: 'trimestre',
  kpis: {
    entretiensRealises: 50,
    beneficiairesActifs: 24,
    livrablesValides: 18,
    progressionMoyenne: 58,
  },
  entretiensParMois: [
    { month: 'T2 2024', count: 42 },
    { month: 'T3 2024', count: 45 },
    { month: 'T4 2024', count: 38 },
    { month: 'T1 2025', count: 50 },
  ],
  repartitionStatut: monthlyData.repartitionStatut,
  progressionMoyenne: [
    { month: 'T2 2024', moyenne: 35 },
    { month: 'T3 2024', moyenne: 42 },
    { month: 'T4 2024', moyenne: 50 },
    { month: 'T1 2025', moyenne: 58 },
  ],
  topBeneficiaires: monthlyData.topBeneficiaires,
}

const yearlyData = {
  period: 'annee',
  kpis: {
    entretiensRealises: 50,
    beneficiairesActifs: 24,
    livrablesValides: 34,
    progressionMoyenne: 58,
  },
  entretiensParMois: [
    { month: '2020', count: 120 },
    { month: '2021', count: 156 },
    { month: '2022', count: 180 },
    { month: '2023', count: 195 },
    { month: '2024', count: 210 },
    { month: '2025', count: 50 },
  ],
  repartitionStatut: monthlyData.repartitionStatut,
  progressionMoyenne: [
    { month: '2020', moyenne: 28 },
    { month: '2021', moyenne: 32 },
    { month: '2022', moyenne: 38 },
    { month: '2023', moyenne: 45 },
    { month: '2024', moyenne: 52 },
    { month: '2025', moyenne: 58 },
  ],
  topBeneficiaires: monthlyData.topBeneficiaires,
}

const periodMap: Record<string, typeof monthlyData> = {
  mois: monthlyData,
  trimestre: quarterlyData,
  annee: yearlyData,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'mois'

  const data = periodMap[period] || monthlyData

  return success(data, `Rapport ${period}`)
}
