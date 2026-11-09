'use client'

import * as React from 'react'
import { UserPlus, Trash2, Pencil, Shield, Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { User } from '@/lib/store'

const ROLES = [
  { value: 'admin', label: 'مدير النظام', color: 'bg-red-100 text-red-800' },
  { value: 'manager', label: 'مدير', color: 'bg-purple-100 text-purple-800' },
  { value: 'editor', label: 'محرر', color: 'bg-blue-100 text-blue-800' },
  { value: 'viewer', label: 'مشاهد', color: 'bg-gray-100 text-gray-800' },
]

const TABS = [
  { key: 'settings', label: 'الإعدادات' },
  { key: 'users', label: 'المستخدمين' },
  { key: 'leaves', label: 'الإجازات' },
  { key: 'data', label: 'الداتا' },
  { key: 'reports', label: 'التقارير' },
  { key: 'comparison', label: 'المقارنة' },
]

export function UsersTab() {
  const [users, setUsers] = React.useState<User[]>([])
  const [open, setOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    name: '', username: '', password: '', role: 'viewer' as User['role'],
    permissions: {} as Record<string, string[]>,
    active: true,
  })

  const load = async () => {
    const r = await fetch('/api/users')
    const data = await r.json()
    setUsers(data)
  }

  React.useEffect(() => { load() }, [])

  const openAdd = () => {
    setForm({
      name: '', username: '', password: '', role: 'viewer',
      permissions: Object.fromEntries(TABS.map((t) => [t.key, ['read']])),
      active: true,
    })
    setEditId(null)
    setOpen(true)
  }

  const openEdit = (u: User) => {
    let perms: Record<string, string[]> = {}
    try { perms = JSON.parse(u.permissions || '{}') } catch { perms = {} }
    setForm({
      name: u.name, username: u.username, password: u.password, role: u.role,
      permissions: perms, active: u.active,
    })
    setEditId(u.id)
    setOpen(true)
  }

  const save = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      toast.error('أدخل الاسم واسم المستخدم')
      return
    }
    const payload = {
      ...form,
      permissions: JSON.stringify(form.permissions),
    }
    if (editId) {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...payload }),
      })
      toast.success('تم التعديل')
    } else {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast.success('تمت الإضافة')
    }
    setOpen(false)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('تم الحذف')
    load()
  }

  const togglePerm = (tab: string, perm: 'read' | 'write') => {
    setForm((f) => {
      const cur = f.permissions[tab] || []
      let next: string[]
      if (perm === 'write') {
        if (cur.includes('write')) {
          // demote to read only
          next = cur.filter((p) => p !== 'write')
        } else {
          next = Array.from(new Set([...cur, 'read', 'write']))
        }
      } else {
        if (cur.includes('read')) {
          // if has write, remove both
          if (cur.includes('write')) {
            next = []
          } else {
            next = cur.filter((p) => p !== 'read')
          }
        } else {
          next = [...cur, 'read']
        }
      }
      return { ...f, permissions: { ...f.permissions, [tab]: next } }
    })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">مدير النظام والعاملين</h2>
          <p className="text-muted-foreground">إدارة المستخدمين والصلاحيات على التابات</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="ml-2 size-4" /> إضافة مستخدم
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary flex items-center gap-2">
            <Shield className="size-5" /> قائمة المستخدمين
          </CardTitle>
          <CardDescription>المستخدمون الذين يمكنهم الدخول للنظام وصلاحياتهم</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary bg-primary/5">
                  <th className="text-right p-2 font-semibold">الاسم</th>
                  <th className="text-right p-2 font-semibold">اسم المستخدم</th>
                  <th className="text-center p-2 font-semibold">الدور</th>
                  <th className="text-center p-2 font-semibold">الحالة</th>
                  <th className="text-center p-2 font-semibold">الصلاحيات</th>
                  <th className="text-center p-2 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">لا يوجد مستخدمون</td></tr>
                )}
                {users.map((u) => {
                  const role = ROLES.find((r) => r.value === u.role) || ROLES[3]
                  let perms: Record<string, string[]> = {}
                  try { perms = JSON.parse(u.permissions || '{}') } catch { perms = {} }
                  return (
                    <tr key={u.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium">{u.name}</td>
                      <td className="p-2 text-muted-foreground">{u.username}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role.color}`}>{role.label}</span>
                      </td>
                      <td className="p-2 text-center">
                        {u.active ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">نشط</Badge> : <Badge variant="secondary">موقوف</Badge>}
                      </td>
                      <td className="p-2 text-center text-xs text-muted-foreground">
                        {Object.entries(perms).filter(([k, v]) => v.length).map(([k, v]) => (
                          <span key={k} className="inline-block bg-muted px-1.5 py-0.5 rounded m-0.5">
                            {TABS.find((t) => t.key === k)?.label}: {v.includes('write') ? 'كتابة' : v.includes('read') ? 'قراءة' : '-'}
                          </span>
                        ))}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(u)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => del(u.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل مستخدم' : 'إضافة مستخدم'}</DialogTitle>
            <DialogDescription>أدخل بيانات المستخدم وحدد الصلاحيات على كل تاب</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الاسم</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>اسم المستخدم</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <Label>كلمة المرور</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <Label>الدور</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as User['role'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
              <Label>المستخدم نشط</Label>
            </div>

            <div>
              <Label className="mb-2 block">الصلاحيات على التابات</Label>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="text-right p-2">التاب</th>
                      <th className="text-center p-2">قراءة</th>
                      <th className="text-center p-2">كتابة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TABS.map((t) => {
                      const perms = form.permissions[t.key] || []
                      return (
                        <tr key={t.key} className="border-b">
                          <td className="p-2 font-medium">{t.label}</td>
                          <td className="text-center p-2">
                            <Switch
                              checked={perms.includes('read')}
                              onCheckedChange={() => togglePerm(t.key, 'read')}
                            />
                          </td>
                          <td className="text-center p-2">
                            <Switch
                              checked={perms.includes('write')}
                              onCheckedChange={() => togglePerm(t.key, 'write')}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ملاحظة: تفعيل "كتابة" يمنح تلقائيًا صلاحية "قراءة". إيقاف "قراءة" يزيل "كتابة" أيضًا.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save}>{editId ? 'حفظ التعديل' : 'إضافة المستخدم'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
