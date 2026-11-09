'use client'

import * as React from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'

type Props = {
  dropdownKey: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function EditableDropdown({ dropdownKey, value, onChange, placeholder, className }: Props) {
  const { dropdowns, addDropdown, updateDropdown, deleteDropdown } = useStore()
  const items = dropdowns[dropdownKey] || []
  const [open, setOpen] = React.useState(false)
  const [newVal, setNewVal] = React.useState('')
  const [editId, setEditId] = React.useState<string | null>(null)
  const [editVal, setEditVal] = React.useState('')

  return (
    <div className="flex items-center gap-2 w-full">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder || 'اختر...'} />
        </SelectTrigger>
        <SelectContent>
          {items.map((it) => (
            <SelectItem key={it.id} value={it.value}>
              {it.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon" title="إدارة القائمة">
            <Pencil className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إدارة القائمة المنسدلة</DialogTitle>
            <DialogDescription>يمكنك إضافة أو تعديل أو حذف عناصر القائمة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="أضف قيمة جديدة..."
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
              />
              <Button
                type="button"
                onClick={async () => {
                  if (!newVal.trim()) return
                  await addDropdown(dropdownKey, newVal.trim())
                  setNewVal('')
                  toast.success('تمت الإضافة')
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">لا توجد عناصر</p>}
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
