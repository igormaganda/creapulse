import { success } from '@/lib/api-response'

export async function GET() {
  const stats = {
    kpis: {
      beneficiairesActifs: 24,
      entretiensCetteSemaine: 8,
      entretiensPrevus: 12,
      livrablesEnAttente: 5,
      progressionMoyenne: 62,
      nouveauxCeMois: 3,
    },
    repartitionTypeEntretiens: [
      { type: 'Bilan', count: 4, color: '#00838F' },
      { type: 'Suivi', count: 6, color: '#FFB74D' },
      { type: 'Atelier', count: 3, color: '#FF6B35' },
    ],
    repartitionStatut: [
      { statut: 'Planifie', count: 5 },
      { statut: 'Confirme', count: 2 },
      { statut: 'Termine', count: 6 },
    ],
    beneficiairesParPhase: [
      { phase: 'Idee', count: 3 },
      { phase: 'Structurer', count: 8 },
      { phase: 'Financer', count: 7 },
      { phase: 'Lancer', count: 6 },
    ],
    activiteRecente: [
      { id: '1', type: 'entretien', message: 'Entretien de suivi termine avec Amadou Diallo', time: 'Il y a 2 heures' },
      { id: '2', type: 'livrable', message: 'Business plan soumis par Lea Fontaine', time: 'Il y a 3 heures' },
      { id: '3', type: 'alerte', message: 'Karim Benali n\'a pas complete son test RIASEC', time: 'Il y a 5 heures' },
      { id: '4', type: 'entretien', message: 'Entretien de bilan programme avec Clara Dubois', time: 'Il y a 1 jour' },
      { id: '5', type: 'inscription', message: 'Nouveau beneficiaire inscrit : Hugo Petit', time: 'Il y a 2 jours' },
    ],
    prochainsRdv: [
      { id: '1', beneficiary: 'Amadou Diallo', type: 'Suivi', date: 'Lun. 3 Fev', time: '10:00' },
      { id: '2', beneficiary: 'Lea Fontaine', type: 'Bilan', date: 'Lun. 3 Fev', time: '14:00' },
      { id: '3', beneficiary: 'Marc Renaud', type: 'Atelier', date: 'Mar. 4 Fev', time: '09:30' },
      { id: '4', beneficiary: 'Clara Dubois', type: 'Suivi', date: 'Mer. 5 Fev', time: '11:00' },
    ],
  }

  return success(stats, 'Statistiques du conseiller')
}
