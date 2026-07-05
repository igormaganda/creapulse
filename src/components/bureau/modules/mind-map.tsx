'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  GitBranch,
  Plus,
  Trash2,
  Copy,
  Download,
  LayoutTemplate,
  ZoomIn,
  ZoomOut,
  Move,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'
import { Undo2, Redo2 } from 'lucide-react'

// ─── Types ──────────────────────────────────

interface MindMapNode {
  id: string
  text: string
  x: number
  y: number
  parentId: string | null
  color: string
  children: string[]
}

const BRANCH_COLORS = [
  '#8b5cf6', // violet
  '#f97316', // orange
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f43f5e', // rose
  '#eab308', // yellow
  '#3b82f6', // blue
  '#ec4899', // pink
]

const STORAGE_KEY = 'creapulse-mindmap'

const TEMPLATES: Record<string, MindMapNode[]> = {
  'Mon Projet': [
    { id: 'root', text: 'Mon Projet', x: 400, y: 300, parentId: null, color: '#8b5cf6', children: ['p1', 'p2', 'p3', 'p4'] },
    { id: 'p1', text: 'Produit / Service', x: 200, y: 120, parentId: 'root', color: '#f97316', children: [] },
    { id: 'p2', text: 'Marché cible', x: 600, y: 120, parentId: 'root', color: '#06b6d4', children: [] },
    { id: 'p3', text: 'Ressources', x: 200, y: 480, parentId: 'root', color: '#10b981', children: [] },
    { id: 'p4', text: 'Objectifs', x: 600, y: 480, parentId: 'root', color: '#f43f5e', children: [] },
  ],
  'Offre Commerciale': [
    { id: 'root', text: 'Offre Commerciale', x: 400, y: 300, parentId: null, color: '#8b5cf6', children: ['o1', 'o2', 'o3', 'o4'] },
    { id: 'o1', text: 'Tarification', x: 180, y: 140, parentId: 'root', color: '#f97316', children: [] },
    { id: 'o2', text: 'Avantages clients', x: 620, y: 140, parentId: 'root', color: '#06b6d4', children: [] },
    { id: 'o3', text: 'Canaux de vente', x: 180, y: 460, parentId: 'root', color: '#10b981', children: [] },
    { id: 'o4', text: 'Différenciation', x: 620, y: 460, parentId: 'root', color: '#eab308', children: [] },
  ],
  'Réseau': [
    { id: 'root', text: 'Mon Réseau', x: 400, y: 300, parentId: null, color: '#8b5cf6', children: ['r1', 'r2', 'r3', 'r4', 'r5'] },
    { id: 'r1', text: 'Mentors', x: 150, y: 100, parentId: 'root', color: '#f97316', children: [] },
    { id: 'r2', text: 'Partenaires', x: 400, y: 80, parentId: 'root', color: '#06b6d4', children: [] },
    { id: 'r3', text: 'Conseillers', x: 650, y: 100, parentId: 'root', color: '#10b981', children: [] },
    { id: 'r4', text: 'Pairs', x: 150, y: 500, parentId: 'root', color: '#f43f5e', children: [] },
    { id: 'r5', text: 'Fournisseurs', x: 650, y: 500, parentId: 'root', color: '#eab308', children: [] },
  ],
}

const CANVAS_W = 900
const CANVAS_H = 650

// ─── Helpers ────────────────────────────────

function uid(): string {
  return crypto.randomUUID()
}

function getNextColor(childCount: number): string {
  return BRANCH_COLORS[childCount % BRANCH_COLORS.length]
}

function buildTextOutline(nodes: MindMapNode[], nodeId: string, indent: number = 0): string {
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return ''
  const prefix = '  '.repeat(indent)
  let result = `${prefix}${indent === 0 ? '## ' : '- '}${node.text}\n`
  for (const childId of node.children) {
    result += buildTextOutline(nodes, childId, indent + 1)
  }
  return result
}

// ─── Main Component ─────────────────────────

// ─── Auto-layout: radial tree from root ───
function autoLayout(nodes: MindMapNode[], canvasW: number, canvasH: number): MindMapNode[] {
  const root = nodes.find(n => n.parentId === null)
  if (!root) return nodes

  const result = nodes.map(n => ({ ...n, children: [...n.children] }))
  const map = new Map(result.map(n => [n.id, n]))
  const cx = canvasW / 2
  const cy = canvasH / 2

  // Root at center
  const r = map.get(root.id)!
  r.x = cx
  r.y = cy

  // Direct children in a circle
  const directChildren = result.filter(n => n.parentId === root.id)
  const childCount = directChildren.length
  directChildren.forEach((child, i) => {
    const angle = (i / Math.max(childCount, 1)) * Math.PI * 2 - Math.PI / 2
    const dist = 160
    child.x = cx + Math.cos(angle) * dist
    child.y = cy + Math.sin(angle) * dist

    // Grandchildren in smaller arc around their parent
    const grandChildren = result.filter(n => n.parentId === child.id)
 grandChildren.forEach((gc, j) => {
      const spread = Math.PI / Math.max(childCount, 3)
 const gcAngle = angle + (j - (grandChildren.length - 1) / 2) * (spread / Math.max(grandChildren.length, 1))
      const gcDist = 100
      gc.x = child.x + Math.cos(gcAngle) * gcDist
      gc.y = child.y + Math.sin(gcAngle) * gcDist
      // Clamp to canvas
      gc.x = Math.max(60, Math.min(canvasW - 60, gc.x))
      gc.y = Math.max(30, Math.min(canvasH - 30, gc.y))
    })
  })

  return result
}

// ─── Main Component ─────────────────────────

export function MindMapModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [nodes, setNodes] = useState<MindMapNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragNodeId, setDragNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null)
  const [serverMapId, setServerMapId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Undo / Redo ───────────────────────
  const [history, setHistory] = useState<MindMapNode[][]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const historyIdxRef = useRef(-1)
  const pushHistory = useCallback((newNodes: MindMapNode[]) => {
    const hi = historyIdxRef.current
    setHistory(prev => [...prev.slice(0, hi + 1), newNodes.map(n => ({ ...n, children: [...n.children] }))])
    const newIdx = hi + 1
    historyIdxRef.current = newIdx
    setHistoryIdx(newIdx)
  }, [])
  const undo = useCallback(() => {
    if (historyIdx <= 0) return
    const prev = history[historyIdx - 1]
    if (prev) {
      setNodes(prev.map(n => ({ ...n, children: [...n.children] })))
      const newIdx = historyIdx - 1
      setHistoryIdx(newIdx)
      historyIdxRef.current = newIdx
    }
  }, [history, historyIdx])
  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const next = history[historyIdx + 1]
    if (next) {
      setNodes(next.map(n => ({ ...n, children: [...n.children] })))
      const newIdx = historyIdx + 1
      setHistoryIdx(newIdx)
      historyIdxRef.current = newIdx
    }
  }, [history, historyIdx])

  // ─── Load from API, fallback localStorage ──
  useEffect(() => {
    async function load() {
      try {
        const res = await authFetch('/api/mind-map')
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            // Load the most recent map
            const latest = json.data[0]
            const resFull = await authFetch(`/api/mind-map?id=${latest.id}`)
            if (resFull.ok) {
              const full = await resFull.json()
              if (full.success && full.data?.nodes) {
                const parsed = full.data.nodes
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setNodes(parsed)
                  setServerMapId(latest.id)
                  pushHistory(parsed)
                  setIsLoading(false)
                  return
                }
              }
            }
          }
        }
      } catch { /* fallback */ }
      // Fallback: localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNodes(parsed)
            pushHistory(parsed)
            setIsLoading(false)
            return
          }
        }
      } catch { /* ignore */ }
      // Default: empty root
      const defaults = [
        { id: 'root', text: 'Idée centrale', x: CANVAS_W / 2, y: CANVAS_H / 2, parentId: null, color: BRANCH_COLORS[0], children: [] },
      ]
      setNodes(defaults)
      pushHistory(defaults)
      setIsLoading(false)
    }
    load()
  }, [])

  // ─── Auto-save (localStorage + API with debounce) ──
  useEffect(() => {
    if (isLoading) return
    // Local always
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes))
    // Debounced server save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        if (serverMapId) {
          await authFetch('/api/mind-map', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: serverMapId, nodes }),
          })
        } else {
          const res = await authFetch('/api/mind-map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes }),
          })
          if (res.ok) {
            const json = await res.json()
            if (json.success && json.data?.id) setServerMapId(json.data.id)
          }
        }
      } catch { /* silent */ }
      setSaving(false)
    }, 2000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [isLoading, nodes, serverMapId])

  // ─── Derived: root node ID (dynamic, not hardcoded) ──
  const rootNodeId = useMemo(() => {
    const root = nodes.find(n => n.parentId === null)
    return root?.id ?? null
  }, [nodes])

  // ─── Focus edit input ────────────────────
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // ─── Keyboard shortcuts ────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return // don't intercept while editing text
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingId, undo, redo])

  // ─── Close context menu on click ─────────
  useEffect(() => {
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  // ─── Node map for quick lookup ───────────
  const nodeMap = useMemo(() => {
    const map = new Map<string, MindMapNode>()
    for (const n of nodes) map.set(n.id, n)
    return map
  }, [nodes])

  // ─── Add child node ──────────────────────
  const addChildNode = useCallback((parentId: string) => {
    const parent = nodeMap.get(parentId)
    if (!parent) return

    const angle = (parent.children.length * Math.PI * 2) / Math.max(parent.children.length + 1, 5) - Math.PI / 2
    const dist = 120 + parent.children.length * 10
    const newX = Math.max(80, Math.min(CANVAS_W - 80, parent.x + Math.cos(angle) * dist))
    const newY = Math.max(40, Math.min(CANVAS_H - 40, parent.y + Math.sin(angle) * dist))

    const newId = uid()
    const color = parent.parentId === null
      ? getNextColor(parent.children.length)
      : parent.color

    const newNode: MindMapNode = {
      id: newId,
      text: 'Nouvelle idée',
      x: newX,
      y: newY,
      parentId,
      color,
      children: [],
    }

    const newNodes = nodes.map(n =>
      n.id === parentId ? { ...n, children: [...n.children, newId] } : n
    )
    newNodes.push(newNode)
    setNodes(newNodes)
    pushHistory(newNodes)
    setSelectedId(newId)
    setEditingId(newId)
    setEditText('Nouvelle idée')
  }, [nodeMap, nodes])

  // ─── Delete node ─────────────────────────
  const deleteNode = useCallback((nodeId: string) => {
    const node = nodeMap.get(nodeId)
    if (!node || !node.parentId) {
      toast.error('Impossible de supprimer le nœud central')
      return
    }

    // Recursively collect all descendant ids
    const toDelete = new Set<string>()
    const collect = (id: string) => {
      toDelete.add(id)
      const n = nodeMap.get(id)
      if (n) n.children.forEach(collect)
    }
    collect(nodeId)

    const newNodes = nodes
      .map(n => n.id === node.parentId
        ? { ...n, children: n.children.filter(c => c !== nodeId) }
        : n)
      .filter(n => !toDelete.has(n.id))
    setNodes(newNodes)
    pushHistory(newNodes)
    setSelectedId(null)
    setEditingId(null)
  }, [nodeMap, nodes])

  // ─── Update node text ────────────────────
  const updateNodeText = useCallback((nodeId: string, text: string) => {
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, text } : n)
    setNodes(newNodes)
    pushHistory(newNodes)
  }, [nodes])

  // ─── Update node position (no history push during drag) ────
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n))
  }, [])

  // Push history on drag end
  useEffect(() => {
    if (!isDragging && nodes.length > 0) {
      // Push to history when drag ends
      const hi = historyIdxRef.current
      const current = history[hi]
      if (!current || JSON.stringify(current) !== JSON.stringify(nodes)) {
        pushHistory(nodes)
      }
    }
  }, [isDragging, nodes, history]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Drag handlers ───────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return // left click only
    e.stopPropagation()
    const node = nodeMap.get(nodeId)
    if (!node) return

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_W / (rect.width * zoom)
    const scaleY = CANVAS_H / (rect.height * zoom)

    setIsDragging(true)
    setDragNodeId(nodeId)
    setDragOffset({
      x: (e.clientX - rect.left) * scaleX - node.x,
      y: (e.clientY - rect.top) * scaleY - node.y,
    })
    setSelectedId(nodeId)
  }, [nodeMap, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragNodeId) return

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_W / (rect.width * zoom)
    const scaleY = CANVAS_H / (rect.height * zoom)

    const x = Math.max(40, Math.min(CANVAS_W - 40, (e.clientX - rect.left) * scaleX - dragOffset.x))
    const y = Math.max(20, Math.min(CANVAS_H - 20, (e.clientY - rect.top) * scaleY - dragOffset.y))
    updateNodePosition(dragNodeId, x, y)
  }, [isDragging, dragNodeId, dragOffset, zoom, updateNodePosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragNodeId(null)
  }, [])

  // ─── Double click to edit ────────────────
  const handleDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = nodeMap.get(nodeId)
    if (!node) return
    setEditingId(nodeId)
    setEditText(node.text)
  }, [nodeMap])

  // ─── Submit edit ─────────────────────────
  const submitEdit = useCallback(() => {
    if (editingId && editText.trim()) {
      updateNodeText(editingId, editText.trim())
    }
    setEditingId(null)
  }, [editingId, editText, updateNodeText])

  // ─── Right click context menu ────────────
  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId })
  }, [])

  // ─── Load template ───────────────────────
  const loadTemplate = useCallback((name: string) => {
    const template = TEMPLATES[name]
    if (template) {
      const loaded = template.map(n => ({ ...n, children: [...n.children] }))
      setNodes(loaded)
      pushHistory(loaded)
      setServerMapId(null) // Reset so template creates a NEW server map
      setSelectedId(null)
      setEditingId(null)
      toast.success(`Template "${name}" chargé`)
    }
  }, [pushHistory])

  // ─── Run auto-layout ────────────────────
  const handleAutoLayout = useCallback(() => {
    const laid = autoLayout(nodes, CANVAS_W, CANVAS_H)
    setNodes(laid)
    pushHistory(laid)
    toast.success('Disposition automatique appliquée')
  }, [nodes, pushHistory])

  // ─── Export as JSON ──────────────────────
  const handleExportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carte-mentale-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Carte mentale exportée en JSON')
  }, [nodes])

  // ─── Export as SVG ───────────────────────
  const handleExportSVG = useCallback(() => {
    if (nodes.length === 0) { toast.error('Aucune donnée à exporter'); return }

    // Build a complete SVG from the node data (nodes are HTML, not SVG children)
    let svgContent = ''
    // Connections
    for (const node of nodes) {
      if (!node.parentId) continue
      const parent = nodes.find(n => n.id === node.parentId)
      if (!parent) continue
      svgContent += `<line x1="${parent.x}" y1="${parent.y}" x2="${node.x}" y2="${node.y}" stroke="${node.color}" stroke-width="2" stroke-opacity="0.4"/>`
    }
    // Nodes
    for (const node of nodes) {
      const isRoot = node.parentId === null
      const fontSize = isRoot ? 14 : 12
      const fontWeight = isRoot ? 'bold' : '600'
      const padding = isRoot ? 20 : 14
      // Estimate text width (rough: 7px per char)
      const textW = node.text.length * 7 + padding * 2
      const textH = fontSize + padding * 1.5
      svgContent += `<rect x="${node.x - textW / 2}" y="${node.y - textH / 2}" width="${textW}" height="${textH}" rx="12" fill="${node.color}15" stroke="${node.color}" stroke-width="2"/>`
      svgContent += `<text x="${node.x}" y="${node.y + fontSize * 0.35}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${node.color}">${node.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W}" height="${CANVAS_H}">
  <rect width="100%" height="100%" fill="#fafafa"/>
  ${svgContent}
</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carte-mentale-${Date.now()}.svg`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Carte mentale exportée en SVG')
  }, [nodes])

  // ─── Export as text outline ──────────────
  const handleExportText = useCallback(async () => {
    const root = nodes.find(n => n.parentId === null)
    if (!root) return
    const outline = buildTextOutline(nodes, root.id)
    try {
      await navigator.clipboard.writeText(outline)
      toast.success('Plan textuel copié dans le presse-papier !')
    } catch {
      toast.error('Impossible de copier dans le presse-papier')
    }
  }, [nodes])

  // ─── Zoom controls ───────────────────────
  const zoomIn = useCallback(() => setZoom(z => Math.min(z + 0.15, 2)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 0.15, 0.4)), [])

  // ─── SVG connections (must be before early return for hooks rules) ───
  const connections = useMemo(() => {
    return nodes
      .filter(n => n.parentId !== null)
      .map(n => {
        const parent = nodeMap.get(n.parentId!)
        if (!parent) return null
        return (
          <line
            key={`line-${n.id}`}
            x1={parent.x}
            y1={parent.y}
            x2={n.x}
            y2={n.y}
            stroke={n.color}
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeLinecap="round"
          />
        )
      })
      .filter(Boolean)
  }, [nodes, nodeMap])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  // ─── Main Render ─────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <GitBranch className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Carte Mentale</h2>
            <p className="text-xs text-muted-foreground">
              {nodes.length} nœud(s){saving ? ' — Sauvegarde…' : ''} — Cliquez pour sélectionner, double-cliquez pour éditer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Templates */}
          {Object.keys(TEMPLATES).map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400"
              onClick={() => loadTemplate(name)}
            >
              <LayoutTemplate className="h-3 w-3" />
              {name}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleExportJSON}
          >
            <Download className="h-3 w-3" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleExportSVG}
          >
            <Download className="h-3 w-3" />
            SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleExportText}
          >
            <Copy className="h-3 w-3" />
            Copier
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white border-0"
              onClick={() => {
                const targetId = selectedId || rootNodeId || 'root'
                addChildNode(targetId)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
            {selectedId && selectedId !== rootNodeId && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800"
                onClick={() => deleteNode(selectedId)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Move className="h-3 w-3" />
              Glisser pour déplacer
            </span>
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIdx <= 0} className="h-8 w-8 p-0" title="Annuler (Ctrl+Z)">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIdx >= history.length - 1} className="h-8 w-8 p-0" title="Refaire (Ctrl+Y)">
              <Redo2 className="h-4 w-4" />
            </Button>
            <span className="w-px h-5 bg-border" />
            <Button variant="ghost" size="sm" onClick={handleAutoLayout} className="h-8 gap-1 text-xs" title="Disposition automatique">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Auto
            </Button>
            <Button variant="ghost" size="sm" onClick={zoomOut} className="h-8 w-8 p-0">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={zoomIn} className="h-8 w-8 p-0">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Canvas ── */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              ref={canvasRef}
              className="relative w-full bg-muted/20 border rounded-lg overflow-hidden cursor-crosshair select-none"
              style={{
                paddingBottom: `${(CANVAS_H / CANVAS_W) * 100}%`,
                minHeight: 400,
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => { setSelectedId(null); setEditingId(null) }}
            >
              <svg
                className="absolute inset-0 w-full h-full mind-map-svg"
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              >
                {/* Grid dots */}
                {Array.from({ length: 20 }, (_, i) => (
                  Array.from({ length: 14 }, (_, j) => (
                    <circle
                      key={`dot-${i}-${j}`}
                      cx={i * 50 + 25}
                      cy={j * 50 + 25}
                      r={0.8}
                      fill="currentColor"
                      className="text-muted-foreground/10"
                    />
                  ))
                ))}
                {/* Connections */}
                {connections}
              </svg>

              {/* Nodes (rendered as HTML for better interaction) */}
              <div
                className="absolute inset-0"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              >
                <AnimatePresence>
                  {nodes.map((node) => {
                    const isSelected = selectedId === node.id
                    const isEditing = editingId === node.id
                    const isRoot = node.parentId === null

                    return (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                        className="absolute"
                        style={{
                          left: `${(node.x / CANVAS_W) * 100}%`,
                          top: `${(node.y / CANVAS_H) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => handleDoubleClick(e, node.id)}
                        onContextMenu={(e) => handleContextMenu(e, node.id)}
                      >
                        <div
                          className={cn(
                            'rounded-xl px-4 py-2 text-center whitespace-nowrap cursor-grab active:cursor-grabbing transition-shadow border-2 min-w-[60px] max-w-[200px] truncate',
                            isRoot
                              ? 'px-5 py-3 shadow-lg'
                              : 'shadow-md',
                            isSelected
                              ? 'ring-2 ring-violet-500 ring-offset-2 shadow-xl'
                              : 'hover:shadow-lg',
                          )}
                          style={{
                            backgroundColor: `${node.color}15`,
                            borderColor: node.color,
                            color: node.color,
                          }}
                        >
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onBlur={submitEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') submitEdit()
                                if (e.key === 'Escape') setEditingId(null)
                                e.stopPropagation()
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="bg-transparent border-none outline-none text-center text-sm font-medium w-full"
                              style={{ color: node.color }}
                            />
                          ) : (
                            <span className={cn(
                              'text-sm font-medium block truncate',
                              isRoot && 'text-base font-bold'
                            )}>
                              {node.text || '...'}
                            </span>
                          )}
                        </div>

                        {/* Add button on hover for non-editing nodes */}
                        {isSelected && !isEditing && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              addChildNode(node.id)
                            }}
                            className="absolute -right-2 -bottom-2 h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md hover:bg-violet-700 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Selected node info ── */}
        {selectedId && nodeMap.get(selectedId) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: nodeMap.get(selectedId)!.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">{nodeMap.get(selectedId)!.text}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {nodeMap.get(selectedId)!.children.length} enfant(s) — {nodeMap.get(selectedId)!.parentId === null ? 'Racine' : 'Branche'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 h-7 text-xs border-violet-300 text-violet-600"
                    onClick={() => addChildNode(selectedId)}
                  >
                    <Plus className="h-3 w-3" />
                    Enfant
                  </Button>
                  {selectedId && selectedId !== rootNodeId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 text-xs text-red-600 border-red-300"
                      onClick={() => deleteNode(selectedId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Context Menu ── */}
        {contextMenu && (
          <div
            className="fixed z-50 rounded-lg border bg-popover p-1 shadow-xl min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                addChildNode(contextMenu.nodeId)
                setContextMenu(null)
              }}
            >
              <Plus className="h-4 w-4" />
              Ajouter un enfant
            </button>
            {contextMenu.nodeId !== rootNodeId && (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNode(contextMenu.nodeId)
                  setContextMenu(null)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}