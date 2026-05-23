'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Search, Edit2, Calendar, Globe, HandCoins, ExternalLink, Newspaper, Users } from 'lucide-react'

/* ─── Actualites ─── */
interface Article {
  id: string
  title: string
  excerpt: string
  publishedAt: string
  status: 'publie' | 'brouillon' | 'archive'
  author: string
}

const articles: Article[] = [
  { id: '1', title: 'CreaPulse V2 : nouvelle interface et IA integree', excerpt: 'Decouvrez les nouveautes de la version 2 de CreaPulse avec une interface modernisee...', publishedAt: '2024-12-15', status: 'publie', author: 'Admin Plateforme' },
  { id: '2', title: 'Programme Tremplin : 50 places supplementaires', excerpt: 'Le programme Tremplin s\'etend avec 50 nouvelles places pour les porteurs de projet...', publishedAt: '2024-12-10', status: 'publie', author: 'Sophie Martin' },
  { id: '3', title: 'Partenariat avec la BPI pour le financement', excerpt: 'Nouveau partenariat strategique pour faciliter l\'acces au financement des startups...', publishedAt: '2024-12-05', status: 'publie', author: 'Admin Plateforme' },
  { id: '4', title: 'Webinaire : comment reussir son business plan', excerpt: 'Inscrivez-vous au webinaire du 20 janvier sur les bonnes pratiques du business plan...', publishedAt: '2024-12-01', status: 'publie', author: 'Jean Dupont' },
  { id: '5', title: 'Guide : les etapes de la creation d\'entreprise', excerpt: 'Article de fond sur les etapes cles de la creation d\'entreprise en France...', publishedAt: '', status: 'brouillon', author: 'Admin Plateforme' },
  { id: '6', title: 'Temoignage : Marie a cree sa boulangerie', excerpt: 'Portrait de Marie qui a lance sa boulangerie artisanale avec l\'aide de CreaPulse...', publishedAt: '2024-11-20', status: 'publie', author: 'Claire Petit' },
  { id: '7', title: 'Nouveau module : analyse juridique automatisee', excerpt: 'Presentation du module d\'analyse juridique qui aide a choisir le bon statut...', publishedAt: '2024-11-10', status: 'publie', author: 'Admin Plateforme' },
  { id: '8', title: 'Calendrier des evenements de janvier 2025', excerpt: 'Retrouvez tous les evenements entrepreneuriaux en Ile-de-France pour janvier...', publishedAt: '', status: 'brouillon', author: 'Admin Plateforme' },
]

/* ─── Partenaires ─── */
interface Partner {
  id: string
  name: string
  website: string
  category: string
  logo?: string
}

const partners: Partner[] = [
  { id: '1', name: 'BPI France', website: 'bpifrance.fr', category: 'Financement' },
  { id: '2', name: 'Region Ile-de-France', website: 'iledefrance.fr', category: 'Institutionnel' },
  { id: '3', name: 'Chambre de Metiers', website: 'cma-idf.fr', category: 'Institutionnel' },
  { id: '4', name: 'Station F', website: 'stationf.co', category: 'Incubateur' },
  { id: '5', name: 'Banque Populaire', website: 'banquepopulaire.fr', category: 'Banque' },
]

/* ─── Aides ─── */
interface Aide {
  id: string
  title: string
  description: string
  eligibility: string
  amount: string
}

const aides: Aide[] = [
  { id: '1', title: 'ACRE - Aide aux Createurs', description: 'Exoneration partielle de charges sociales pendant la premiere annee.', eligibility: 'Beneficiaire de l\'ARE ou RSA', amount: 'Jusqu\'a 4 916€' },
  { id: '2', title: 'Pret d\'Amenagement du Fonds Europeen', description: 'Pret a taux zero pour le demarrage d\'activite.', eligibility: 'Porteur de projet en IDF', amount: 'Jusqu\'a 10 000€' },
  { id: '3', title: 'ARCE - Aide au Retour a l\'Emploi', description: 'Versement en deux fois de 45% des droits ARE restants.', eligibility: 'Inscrit a Pole Emploi', amount: 'Jusqu\'a 10 800€' },
]

const articleStatusColors: Record<string, string> = {
  publie: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  brouillon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  archive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export function Contenus() {
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addType, setAddType] = useState<'article' | 'partner' | 'aide'>('article')

  const filteredArticles = articles.filter(a => search === '' || a.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Contenus</h2>
          <p className="text-sm text-muted-foreground">Gestion du contenu editorial et des partenaires</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#FFB74D] text-[#0F172A] hover:bg-[#FFA726]">
              <Plus className="h-4 w-4" />
              Ajouter un contenu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau contenu</DialogTitle>
              <DialogDescription>Ajoutez du contenu a la plateforme</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={addType} onValueChange={(v) => setAddType(v as 'article' | 'partner' | 'aide')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Actualite</SelectItem>
                    <SelectItem value="partner">Partenaire</SelectItem>
                    <SelectItem value="aide">Aide & Dispositif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {addType === 'article' && (
                <>
                  <div className="grid gap-2"><Label>Titre</Label><Input placeholder="Titre de l'article" /></div>
                  <div className="grid gap-2"><Label>Extrait</Label><Textarea placeholder="Resume de l'article..." /></div>
                </>
              )}
              {addType === 'partner' && (
                <>
                  <div className="grid gap-2"><Label>Nom</Label><Input placeholder="Nom du partenaire" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Site web</Label><Input placeholder="example.fr" /></div>
                    <div className="grid gap-2"><Label>Categorie</Label><Input placeholder="Ex: Financement" /></div>
                  </div>
                </>
              )}
              {addType === 'aide' && (
                <>
                  <div className="grid gap-2"><Label>Titre du dispositif</Label><Input placeholder="Nom de l'aide" /></div>
                  <div className="grid gap-2"><Label>Description</Label><Textarea placeholder="Description du dispositif..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Eligibilite</Label><Input placeholder="Qui est eligible ?" /></div>
                    <div className="grid gap-2"><Label>Montant</Label><Input placeholder="Ex: 5 000€" /></div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button className="bg-[#FFB74D] text-[#0F172A] hover:bg-[#FFA726]">Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="actualites">
        <TabsList>
          <TabsTrigger value="actualites" className="gap-1"><Newspaper className="h-3.5 w-3.5" /> Actualites ({articles.length})</TabsTrigger>
          <TabsTrigger value="partenaires" className="gap-1"><Users className="h-3.5 w-3.5" /> Partenaires ({partners.length})</TabsTrigger>
          <TabsTrigger value="aides" className="gap-1"><HandCoins className="h-3.5 w-3.5" /> Aides ({aides.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="actualites" className="space-y-3 mt-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead className="hidden sm:table-cell">Auteur</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="max-w-[280px]">
                            <p className="text-sm font-medium truncate">{a.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{a.excerpt}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{a.author}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={articleStatusColors[a.status]}>{a.status === 'publie' ? 'Publie' : a.status === 'brouillon' ? 'Brouillon' : 'Archive'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partenaires" className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <Badge variant="secondary" className="mt-1">{p.category}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-3.5 w-3.5" /></Button>
                </div>
                <a href={`https://${p.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-[#00838F]">
                  <Globe className="h-3 w-3" />{p.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="aides" className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aides.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Edit2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Eligibilite :</span><span>{a.eligibility}</span></div>
                  <div className="flex items-center gap-1 text-xs"><HandCoins className="h-3 w-3 text-emerald-500" /><span className="text-muted-foreground">Montant :</span><span className="font-semibold text-emerald-600">{a.amount}</span></div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
