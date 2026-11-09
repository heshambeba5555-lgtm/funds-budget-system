'use client'

import { create } from 'zustand'

export type Signature = {
  label: string
  name: string
}

export type Setting = {
  id: string
  universityName: string
  facultyName: string
  deanName: string
  directorName: string
  assistantDirectorName: string
  cadreOfficerName: string
  financialAffairsOfficerName: string
  administrationName: string
  jobName: string
  degreeName: string
  academicYear: string
  month: string
  day: string
  universityLogo: string
  facultyLogo: string
  // موضع كل شعار على حدة
  universityLogoPosition: 'right' | 'left'
  facultyLogoPosition: 'right' | 'left'
  logosPosition: 'right' | 'left'
  currentReportName: string
  reportNames: string // JSON string of string[] (multi-select)
  signatures: string // JSON string of Signature[]
  forfeitingLeaveTypes: string // JSON string of string[] (leave types that forfeit rewards)
}

export type DropdownItem = {
  id: string
  key: string
  value: string
  order: number
}

export type User = {
  id: string
  name: string
  username: string
  password: string
  role: 'admin' | 'manager' | 'editor' | 'viewer'
  permissions: string
  active: boolean
}

export type Leave = {
  id: string
  doctorName: string
  leaveType: string
  fromDate: string
  toDate: string
  degree: string
  conditions: string
  notes: string
}

export type Member = {
  id?: string
  kind: 'funds' | 'budget'
  serial: string
  code: string
  basic: string // الأساسي
  bound: string // المربوط
  basicSalary: string // الأساسي المربوط (للتوافق)
  exchangeNo: string
  name: string
  administration: string
  degree: string
  job: string
  nationalId: string
  qualityReward: string
  extraHours: string
  diff90: string
  teachingReward: string
  percent200: string
  total: string
  extraColumns: string
  order: number
}

export type ColumnDef = {
  id: string
  kind: 'funds' | 'budget'
  key: string
  label: string
  type: 'text' | 'number'
  order: number
}

export type Reward = {
  id: string
  type: 'degree' | 'job' // مبنية على الدرجة أو الوظيفة
  name: string // اسم الدرجة أو الوظيفة
  category: 'quality' | 'teaching' | 'extra_hours' | 'diff_90' | 'percent_200'
  rewardType: 'percent' | 'fixed' // نسبة من الأساسي أو مبلغ مقطوع
  amount: string // نسبة% أو مبلغ مقطوع
}

type AppState = {
  setting: Setting | null
  dropdowns: Record<string, DropdownItem[]>
  currentUser: User | null
  loading: boolean

  fetchSetting: () => Promise<void>
  saveSetting: (s: Partial<Setting>) => Promise<void>
  fetchDropdowns: () => Promise<void>
  addDropdown: (key: string, value: string) => Promise<void>
  updateDropdown: (id: string, value: string) => Promise<void>
  deleteDropdown: (id: string) => Promise<void>
  setCurrentUser: (u: User | null) => void
  init: () => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  setting: null,
  dropdowns: {},
  currentUser: null,
  loading: false,

  fetchSetting: async () => {
    const r = await fetch('/api/settings')
    const s = await r.json()
    set({ setting: s })
  },

  saveSetting: async (s) => {
    const r = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    const updated = await r.json()
    set({ setting: { ...(get().setting as Setting), ...updated } })
  },

  fetchDropdowns: async () => {
    const r = await fetch('/api/dropdowns')
    const all = (await r.json()) as DropdownItem[]
    const map: Record<string, DropdownItem[]> = {}
    for (const d of all) {
      if (!map[d.key]) map[d.key] = []
      map[d.key].push(d)
    }
    set({ dropdowns: map })
  },

  addDropdown: async (key, value) => {
    const r = await fetch('/api/dropdowns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    const item = await r.json()
    set((state) => ({
      dropdowns: {
        ...state.dropdowns,
        [key]: [...(state.dropdowns[key] || []), item],
      },
    }))
  },

  updateDropdown: async (id, value) => {
    const r = await fetch('/api/dropdowns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, value }),
    })
    const item = await r.json()
    set((state) => {
      const map = { ...state.dropdowns }
      for (const k in map) {
        map[k] = map[k].map((d) => (d.id === id ? item : d))
      }
      return { dropdowns: map }
    })
  },

  deleteDropdown: async (id) => {
    await fetch('/api/dropdowns', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    set((state) => {
      const map = { ...state.dropdowns }
      for (const k in map) {
        map[k] = map[k].filter((d) => d.id !== id)
      }
      return { dropdowns: map }
    })
  },

  setCurrentUser: (u) => set({ currentUser: u }),

  init: async () => {
    set({ loading: true })
    try {
      // Initialize defaults
      await fetch('/api/init', { method: 'POST' })
      await get().fetchSetting()
      await get().fetchDropdowns()
    } finally {
      set({ loading: false })
    }
  },
}))
