'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Palette, Mail, Key, AlertTriangle, Save, Eye, EyeOff, Globe, Shield } from 'lucide-react'
import { toast } from 'sonner'

export function Configuration() {
  const [platformName, setPlatformName] = useState('CreaPulse')
  const [logoUrl, setLogoUrl] = useState('/images/hero-entrepreneur.webp')
  const [primaryColor, setPrimaryColor] = useState('#00838F')
  const [accentColor, setAccentColor] = useState('#FFB74D')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSmtpKey, setShowSmtpKey] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  const emailTemplates = [
    { id: '1', name: 'Bienvenue - Inscription', subject: 'Bienvenue sur CreaPulse !', status: 'actif' },
    { id: '2', name: 'Mot de passe oublie', subject: 'Reinitialisation de votre mot de passe', status: 'actif' },
    { id: '3', name: 'Invitation organisation', subject: 'Vous etes invite a rejoindre une organisation', status: 'actif' },
    { id: '4', name: 'Rappel onboarding', subject: 'Completez votre profil CreaPulse', status: 'actif' },
    { id: '5', name: 'Notification module', subject: 'Nouveau module disponible sur CreaPulse', status: 'inactif' },
  ]

  const apiKeys = [
    { name: 'JWT Secret', value: 'creapulse-v2-sec...xxxx', masked: true },
    { name: 'API Key Stripe', value: 'sk_live_51Qx...xxxx', masked: true },
    { name: 'SMTP Password', value: 'app_password...xxxx', masked: true },
    { name: 'SendGrid API Key', value: 'SG.xxxx...xxxx', masked: true },
  ]

  const handleSave = () => {
    toast.success('Configuration sauvegardee', { description: 'Les modifications ont ete enregistrees.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configuration</h2>
          <p className="text-sm text-muted-foreground">Parametres globaux de la plateforme</p>
        </div>
        <Button onClick={handleSave} className="gap-2 bg-[#FFB74D] text-[#0F172A] hover:bg-[#FFA726]">
          <Save className="h-4 w-4" />
          Sauvegarder
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-1"><Settings className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1"><Palette className="h-3.5 w-3.5" /> Apparence</TabsTrigger>
          <TabsTrigger value="emails" className="gap-1"><Mail className="h-3.5 w-3.5" /> Emails</TabsTrigger>
          <TabsTrigger value="security" className="gap-1"><Shield className="h-3.5 w-3.5" /> Securite</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Plateforme</CardTitle>
              <CardDescription>Informations generales de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 max-w-md">
                <Label>Nom de la plateforme</Label>
                <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
              </div>
              <div className="grid gap-2 max-w-md">
                <Label>URL du logo</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between max-w-md">
                <div>
                  <Label>Mode maintenance</Label>
                  <p className="text-xs text-muted-foreground">Desactive l&apos;acces a la plateforme pour tous les utilisateurs</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              {maintenanceMode && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-900/20 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    La plateforme est en mode maintenance. Seuls les administrateurs y ont acces.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Parametres par defaut du tenant</CardTitle>
              <CardDescription>Valeurs appliquees aux nouvelles organisations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 max-w-md">
                <Label>Plan par defaut</Label>
                <Select defaultValue="Starter">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 max-w-md">
                <Label>Langue par defaut</Label>
                <Select defaultValue="fr">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Francais</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Couleurs de la marque</CardTitle>
              <CardDescription>Personnalisez les couleurs principales de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 max-w-md">
                <Label>Couleur principale (Primary)</Label>
                <div className="flex gap-2">
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                  <div className="h-10 w-10 rounded-lg border" style={{ backgroundColor: primaryColor }} />
                </div>
              </div>
              <div className="grid gap-2 max-w-md">
                <Label>Couleur d&apos;accent (Accent)</Label>
                <div className="flex gap-2">
                  <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1" />
                  <div className="h-10 w-10 rounded-lg border" style={{ backgroundColor: accentColor }} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Apercu :</span>
                <div className="flex gap-2">
                  <Button className="text-white" style={{ backgroundColor: primaryColor }}>Principal</Button>
                  <Button className="text-[#0F172A]" style={{ backgroundColor: accentColor }}>Accent</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Templates d&apos;emails</CardTitle>
                <CardDescription>Gerez les templates d&apos;emails automatiques</CardDescription>
              </div>
              <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Apercu
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apercu du template</DialogTitle>
                    <DialogDescription>Visualisez le rendu de l&apos;email</DialogDescription>
                  </DialogHeader>
                  <div className="rounded-lg border p-6 bg-muted/50 space-y-3">
                    <p className="text-sm font-medium">Objet : Bienvenue sur CreaPulse !</p>
                    <Separator />
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Bonjour {'{{firstName}}'},</p>
                      <p>Bienvenue sur CreaPulse, votre plateforme de creation d&apos;entreprise.</p>
                      <p>Commencez votre parcours en completant votre profil.</p>
                      <Button size="sm">Commencer maintenant</Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEmailOpen(false)}>Fermer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emailTemplates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={t.status === 'actif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}>
                        {t.status === 'actif' ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cles API</CardTitle>
              <CardDescription>Cles securisees utilisees par la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{key.value}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Regenerer</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
