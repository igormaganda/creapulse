import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'

export async function GET() {
  const stats = {
    kpis: {
      totalBeneficiaires: 130,
      conseillersActifs: 7,
      entretiensCeMois: 48,
      tauxCompletionMoyen: 62,
      nouveauxCeMois: 18,
      livrablesValides: 34,
    },
    beneficiairesParPhase: [
      { phase: 'Ideation', count: 28 },
      { phase: 'Structuration', count: 42 },
      { phase: 'Financement', count: 31 },
      { phase: 'Lancement', count: 18 },
      { phase: 'Developpement', count: 11 },
    ],
    evolutionInscriptions: [
      { mois: 'Sep', inscriptions: 12 },
      { mois: 'Oct', inscriptions: 18 },
      { mois: 'Nov', inscriptions: 15 },
      { mois: 'Dec', inscriptions: 22 },
      { mois: 'Jan', inscriptions: 28 },
      { mois: 'Fev', inscriptions: 25 },
      { mois: 'Mar', inscriptions: 32 },
      { mois: 'Avr', inscriptions: 19 },
      { mois: 'Mai', inscriptions: 35 },
      { mois: 'Jun', inscriptions: 30 },
    ],
    repartitionSecteur: [
      { name: 'Commerce', value: 28, color: '#FF6B35' },
      { name: 'Restauration', value: 22, color: '#00838F' },
      { name: 'Services', value: 20, color: '#FFB74D' },
      { name: 'Tech', value: 15, color: '#8B5CF6' },
      { name: 'BTP', value: 10, color: '#10B981' },
      { name: 'Autre', value: 5, color: '#6B7280' },
    ],
    completionParConseiller: [
      { name: 'S. Martin', completion: 72 },
      { name: 'P. Dubois', completion: 68 },
      { name: 'C. Lefevre', completion: 65 },
      { name: 'M. Petit', completion: 61 },
      { name: 'J. Moreau', completion: 58 },
      { name: 'A. Roux', completion: 55 },
      { name: 'I. Fontaine', completion: 20 },
    ],
    keyMetrics: {
      tempsMoyenParcours: '4.2 mois',
      tauxReussiteTremplin: '72%',
      scoreBPMoyen: '68/100',
    },
    topConseillers: [
      { name: 'Sophie Martin', beneficiaires: 28, avgProgress: 72 },
      { name: 'Pierre Dubois', beneficiaires: 25, avgProgress: 68 },
      { name: 'Claire Lefevre', beneficiaires: 22, avgProgress: 65 },
      { name: 'Marc Petit', beneficiaires: 20, avgProgress: 61 },
      { name: 'Julie Moreau', beneficiaires: 18, avgProgress: 58 },
    ],
  }

  return success(stats, 'Statistiques du centre')
}
