'use client'

import { useState, useTransition } from 'react'
import { Settings2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { setProcessBudget, removeProcessBudget } from '@/lib/actions/budget'
import { calculateCost } from '@/lib/costs/constants'
import { formatCost, formatTokensFull } from '@/lib/costs/format'

interface BudgetSettingDialogProps {
  processId: string
  processName: string
  currentBudget: number | null
}

export function BudgetSettingDialog({
  processId,
  processName,
  currentBudget,
}: BudgetSettingDialogProps) {
  const [open, setOpen] = useState(false)
  const [budget, setBudget] = useState<string>(
    currentBudget ? String(currentBudget) : ''
  )
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const budgetNum = parseInt(budget, 10)
  const isValid = !isNaN(budgetNum) && budgetNum >= 1000
  const estimatedCost = isValid ? calculateCost(budgetNum) : null

  function handleSave() {
    if (!isValid) {
      setError('Minimum budget is 1,000 tokens')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await setProcessBudget(processId, budgetNum)
      if ('error' in result) {
        setError(result.error)
      } else {
        toast(`Budget saved: ${processName} set to ${formatTokensFull(budgetNum)} tokens`)
        setOpen(false)
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeProcessBudget(processId)
      if ('error' in result) {
        setError(result.error)
      } else {
        toast(`Budget removed for ${processName}`)
        setOpen(false)
        setShowRemoveConfirm(false)
        setBudget('')
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      // Reset state when opening
      setBudget(currentBudget ? String(currentBudget) : '')
      setError(null)
      setShowRemoveConfirm(false)
    }
  }

  // Trigger: icon button if budget exists, text button if not
  const trigger = currentBudget !== null ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            aria-label={`Edit token budget for ${processName}`}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit Budget</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Button variant="outline" size="sm">
      Set Budget
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Set Token Budget
          </DialogTitle>
          <p className="text-sm text-zinc-500">
            Process: {processName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="token-budget">Token Limit</Label>
            <Input
              id="token-budget"
              type="number"
              min={1000}
              step={1000}
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value)
                setError(null)
              }}
              className="text-right font-mono"
              placeholder="100000"
            />
            {estimatedCost !== null && (
              <p className="text-xs text-zinc-400">
                Estimated cost: ~{formatCost(estimatedCost)}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {currentBudget !== null && !showRemoveConfirm && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => setShowRemoveConfirm(true)}
                disabled={isPending}
              >
                Remove Budget
              </Button>
            )}
            {showRemoveConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">
                  Remove budget for {processName}?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 h-7"
                  onClick={handleRemove}
                  disabled={isPending}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Discard Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || isPending}
            >
              Save Budget
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
