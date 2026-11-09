'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

type Props = {
  optionsKey: string
  selectedValues: string[]
  onChange: (vals: string[]) => void
  className?: string
}

export function MultiSelectCheckboxes({ optionsKey, selectedValues, onChange, className }: Props) {
  const { dropdowns, addDropdown, updateDropdown, deleteDropdown } = useStore()
  const items = dropdowns[optionsKey] || []
  const [open, setOpen] = React.useState(false)
  const [newVal, setNewVal] = React.useState('')
  const [editId, setEditId] = React.useState<string | null>(null)
  const [editVal, setEditVal] = React.useState('')

  const toggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value))
    } else {
      onChange([...selectedValues, value])
    }
  }

  return (
    <div className={className}>
      <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto bg-card">
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-3">
            لا توجد أسماء. اضغط "إدارة القائمة" لإضافة أسماء.
          </p>
        )}
        {items.map((it) => (
          <label
            key={it.id}
            className="flex items-center gap-3 p-2 hover:bg-muted/40 rounded cursor-pointer"
          >
            <Checkbox
              checked={selectedValues.includes(it.value)}
              onCheckedChange={() => toggle(it.value)}
            />
            <span className="text-sm flex-1">{it.value}</span>
            {selectedValues.includes(it.value) && (
              <Check className="size-4 text-primary" />
            )}
          </label>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="mt-2">
            <Pencil className="size-4 ml-1" /> إدارة القائمة
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إدارة قائمة الأسماء</DialogTitle>
            <DialogDescription>يمكنك إضافة أو تعديل أو حذف أسماء التقارير</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="أضف اسمًا جديدًا..."
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
              />
              <Button
                type="button"
                onClick={async () => {
                  if (!newVal.trim()) return
                  await addDropdown(optionsKey, newVal.trim())
                  setNewVal('')
                  toast.success('تمت الإضافة')
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {items.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">لا توجد عناصر</p>
              )}
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-2 border rounded-md p-2">
                  {editId === it.id ? (
                    <>
                      <Input value={editVal} onChange={(e) => setEditVal(e.target.value)} className="flex-1" />
                      <Button
                        size="icon"
                        type="button"
                        variant="default"
                        onClick={async () => {
                          if (!editVal.trim()) return
                          await updateDropdown(it.id, editVal.trim())
                          // Update selected values if the edited value was selected
                          if (selectedValues.includes(it.value)) {
                            onChange(selectedValues.map((v) => (v === it.value ? editVal.trim() : v)))
                          }
                          setEditId(null)
                          toast.success('تم التعديل')
                        }}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button size="icon" type="button" variant="outline" onClick={() => setEditId(null)}>
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{it.value}</span>
                      <Button
                        size="icon"
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditId(it.id)
                          setEditVal(it.value)
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          await deleteDropdown(it.id)
                          // Remove from selected if present
                          if (selectedValues.includes(it.value)) {
                            onChange(selectedValues.filter((v) => v !== it.value))
                          }
                          toast.success('تم الحذف')
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
