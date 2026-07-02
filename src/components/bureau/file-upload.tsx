'use client'

// ============================================
// CreaPulse V2 — Reusable File Upload Component
// Drag-and-drop with validation, preview, progress
// ============================================

import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { Upload, FileText, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useUploadStore, type UploadedFile } from './upload-store'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────

interface FileUploadProps {
  accept?: string           // e.g., ".pdf,.doc,.docx"
  maxSize?: number          // in bytes, default 10MB
  maxFiles?: number         // default 5
  onUploadComplete?: (files: UploadedFile[]) => void
  label?: string
  description?: string
}

interface PendingFile {
  id: string
  file: File
  preview?: string
}

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.jpg', '.jpeg', '.png', '.webp',
]

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const DEFAULT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp'

// ─── Helpers ────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function getFileExtension(name: string): string {
  const lastDot = name.lastIndexOf('.')
  return lastDot !== -1 ? name.substring(lastDot).toLowerCase() : ''
}

function getFileIcon(fileName: string) {
  const ext = getFileExtension(fileName)
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ImageIcon
  return FileText
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Component ──────────────────────────────

export function FileUpload({
  accept = DEFAULT_ACCEPT,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  onUploadComplete,
  label = 'Téléverser des fichiers',
  description = 'Glissez-déposez vos fichiers ici ou cliquez pour parcourir',
}: FileUploadProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Cleanup preview Object URLs on unmount ─────────────────
  useEffect(() => {
    return () => {
      // Revoke all pending preview object URLs on unmount
      pendingFiles.forEach(f => {
        if (f.preview && f.preview.startsWith('blob:')) {
          URL.revokeObjectURL(f.preview)
        }
      })
    }
  }, []) // empty deps - only on unmount

  const {
    files: uploadedFiles,
    isUploading,
    progress,
    addFile,
    removeFile,
    setUploading,
    setProgress,
  } = useUploadStore()

  // ─── Validation ─────────────────────────

  const validateFile = useCallback((file: File): string | null => {
    const ext = getFileExtension(file.name)

    // Check file type
    if (accept) {
      const acceptedExts = accept.split(',').map((s) => s.trim().toLowerCase())
      if (acceptedExts.length > 0 && !acceptedExts.some((ae) => ext === ae)) {
        return `Type non autorisé : .${ext}. Types acceptés : ${acceptedExts.join(', ')}`
      }
    }

    // Check file size
    if (file.size > maxSize) {
      return `Fichier trop volumineux (${formatFileSize(file.size)}). Maximum : ${formatFileSize(maxSize)}`
    }

    return null
  }, [accept, maxSize])

  // ─── File Handling ──────────────────────

  const addPendingFiles = useCallback((files: FileList | File[]) => {
    const newErrors: string[] = []
    const newPending: PendingFile[] = []
    const fileList = Array.from(files)

    for (const file of fileList) {
      if (pendingFiles.length + newPending.length + uploadedFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} fichiers autorisés`)
        break
      }

      const error = validateFile(file)
      if (error) {
        newErrors.push(`${file.name} : ${error}`)
        continue
      }

      // Create image preview
      let preview: string | undefined
      if (IMAGE_TYPES.includes(file.type)) {
        preview = URL.createObjectURL(file)
      }

      newPending.push({
        id: generateId(),
        file,
        preview,
      })
    }

    setErrors(newErrors)
    setPendingFiles((prev) => [...prev, ...newPending])
  }, [pendingFiles.length, uploadedFiles.length, maxFiles, validateFile])

  // ─── Drag & Drop ────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addPendingFiles(e.dataTransfer.files)
    }
  }, [addPendingFiles])

  // ─── File Input ─────────────────────────

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addPendingFiles(e.target.files)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [addPendingFiles])

  // ─── Upload ─────────────────────────────

  const handleUpload = useCallback(async () => {
    if (pendingFiles.length === 0) return

    setUploading(true)
    setProgress(0)

    const totalFiles = pendingFiles.length
    const completedFiles: UploadedFile[] = []

    for (let i = 0; i < pendingFiles.length; i++) {
      const pending = pendingFiles[i]
      const formData = new FormData()
      formData.append('file', pending.file)

      try {
        // Simulated progress: distribute evenly across files
        const baseProgress = (i / totalFiles) * 100
        setProgress(baseProgress + 10)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const message = errorData?.error?.message || `Erreur lors du téléversement de ${pending.file.name}`
          toast.error(message)
          setProgress(baseProgress + (100 / totalFiles))
          continue
        }

        const result = await response.json()

        if (result.success && result.data) {
          const uploaded: UploadedFile = {
            id: result.data.id,
            name: result.data.name,
            size: result.data.size,
            type: result.data.type,
            url: result.data.url,
            uploadedAt: new Date(result.data.uploadedAt),
          }

          completedFiles.push(uploaded)
          addFile(uploaded)

          // Clean up preview URL
          if (pending.preview) {
            URL.revokeObjectURL(pending.preview)
          }
        }

        // Update progress
        setProgress(((i + 1) / totalFiles) * 100)
      } catch {
        toast.error(`Erreur réseau lors du téléversement de ${pending.file.name}`)
        if (pending.preview) {
          URL.revokeObjectURL(pending.preview)
        }
        setProgress(((i + 1) / totalFiles) * 100)
      }
    }

    // Clear pending files
    setPendingFiles([])
    setErrors([])
    setUploading(false)

    if (completedFiles.length > 0) {
      toast.success(`${completedFiles.length} fichier${completedFiles.length > 1 ? 's' : ''} téléversé${completedFiles.length > 1 ? 's' : ''} avec succès`)
      onUploadComplete?.(completedFiles)
    }
  }, [pendingFiles, addFile, setUploading, setProgress, onUploadComplete])

  // ─── Remove ─────────────────────────────

  const removePending = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const removeUploaded = useCallback((id: string) => {
    removeFile(id)
    toast.info('Fichier retiré')
  }, [removeFile])

  // ─── Render ─────────────────────────────

  const canUpload = pendingFiles.length > 0 && !isUploading
  const totalFileCount = pendingFiles.length + uploadedFiles.length

  return (
    <div className="space-y-4">
      {/* Label & Description */}
      {label && (
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
          p-8 transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-teal-400 hover:bg-muted/50'
          }
          ${totalFileCount >= maxFiles ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className={`
          flex h-12 w-12 items-center justify-center rounded-full transition-colors
          ${isDragging ? 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300' : 'bg-muted text-muted-foreground'}
        `}>
          <Upload className="h-6 w-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragging ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos fichiers'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ou <span className="text-teal-600 dark:text-teal-400 underline">parcourir vos fichiers</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {ALLOWED_EXTENSIONS.join(', ')} — Max {formatFileSize(maxSize)} par fichier — {maxFiles} fichiers max
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInput}
          className="hidden"
          aria-label="Sélectionner des fichiers"
        />
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pending Files (pre-upload) */}
      {pendingFiles.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {pendingFiles.length} fichier{pendingFiles.length > 1 ? 's' : ''} en attente
            </p>
            {pendingFiles.map((pf) => (
              <div key={pf.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-2">
                {/* Preview or icon */}
                {pf.preview ? (
                  <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 bg-muted">
                    <img
                      src={pf.preview}
                      alt={pf.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted shrink-0">
                    {(() => { const Icon = getFileIcon(pf.file.name); return <Icon className="h-5 w-5 text-muted-foreground" /> })()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pf.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(pf.file.size)}</p>
                </div>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => { e.stopPropagation(); removePending(pf.id) }}
                  aria-label={`Retirer ${pf.file.name}`}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}

            {/* Upload Button */}
            <Button
              onClick={(e) => { e.stopPropagation(); handleUpload() }}
              disabled={isUploading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Téléversement en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Téléverser {pendingFiles.length} fichier{pendingFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progression</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Check className="h-3.5 w-3.5 inline mr-1" />
              {uploadedFiles.length} fichier{uploadedFiles.length > 1 ? 's' : ''} téléversé{uploadedFiles.length > 1 ? 's' : ''}
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {uploadedFiles.map((uf) => (
                <div key={uf.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-2">
                  {/* Icon */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 shrink-0">
                    {(() => { const Icon = getFileIcon(uf.name); return <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> })()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uf.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uf.size)} — {new Date(uf.uploadedAt).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeUploaded(uf.id)}
                    aria-label={`Retirer ${uf.name}`}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
