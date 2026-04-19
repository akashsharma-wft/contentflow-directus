'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface DeletePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postTitle: string
  onConfirm: () => Promise<void>
  dialogTitle?: string
  dialogBody?: string
  confirmLabel?: string
  cancelLabel?: string
}

export function DeletePostDialog({
  open,
  onOpenChange,
  postTitle,
  onConfirm,
  dialogTitle    = 'Delete Post',
  dialogBody     = 'Are you sure you want to delete "{title}"? This action cannot be undone.',
  confirmLabel   = 'Delete Post',
  cancelLabel    = 'Cancel',
}: DeletePostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const bodyText = dialogBody.replace('{title}', postTitle)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#1a1d27] border border-white/10 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle size={15} className="text-red-400" />
            </div>
            <AlertDialogTitle className="text-white text-base font-semibold">
              {dialogTitle}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-white/45 text-sm leading-relaxed mt-2">
            {bodyText}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} />
            {isDeleting ? 'Deleting...' : confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}