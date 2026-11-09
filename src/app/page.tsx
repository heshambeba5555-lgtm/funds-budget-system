'use client'

import * as React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Settings, Users, CalendarDays, Database, FileText, GitCompare, ShieldCheck } from 'lucide-react'
import { useStore } from '@/lib/store'
import { SettingsTab } from '@/components/SettingsTab'
import { UsersTab } from '@/components/UsersTab'
import { LeavesTab } from '@/components/LeavesTab'
import { DataTab } from '@/components/DataTab'
import { ReportsTab } from '@/components/ReportsTab'
import { ComparisonTab } from '@/components/ComparisonTab'

export default function Home() {
  const { init, setting, loading } = useStore()

  React.useEffect(() => {
    init()
  }, [init])

  if (loading || !setting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">جارٍ تحميل البرنامج...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      {/* Top banner */}
      <header className="official-gradient text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-primary-foreground/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-primary-foreground/20">
              <ShieldCheck className="size-7" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold">صناديق خاصة وموازنة أعضاء هيئة التدريس ومعاونيهم</h1>
              <p className="text-xs md:text-sm opacity-90">
                {setting.universityName} - {setting.facultyName}
              </p>
            </div>
          </div>
          <div className="text-left text-xs md:text-sm opacity-90">
            <p>تصميم: أ. هشام محمد عيد عبد السلام</p>
            <p>مدير الكلية - العام: {setting.academicYear}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-2 md:px-4 py-4 md:py-6">
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto bg-card border shadow-sm">
            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="size-5" />
              <span className="text-xs md:text-sm">الإعدادات</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="size-5" />
              <span className="text-xs md:text-sm">مدير النظام والعاملين</span>
            </TabsTrigger>
            <TabsTrigger value="leaves" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarDays className="size-5" />
              <span className="text-xs md:text-sm">الإجازات</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="size-5" />
              <span className="text-xs md:text-sm">الداتا</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="size-5" />
              <span className="text-xs md:text-sm">التقارير</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GitCompare className="size-5" />
              <span className="text-xs md:text-sm">المقارنة</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6"><SettingsTab /></TabsContent>
          <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
          <TabsContent value="leaves" className="mt-6"><LeavesTab /></TabsContent>
          <TabsContent value="data" className="mt-6"><DataTab /></TabsContent>
          <TabsContent value="reports" className="mt-6"><ReportsTab /></TabsContent>
          <TabsContent value="comparison" className="mt-6"><ComparisonTab /></TabsContent>
        </Tabs>
      </main>

      <footer className="bg-primary text-primary-foreground py-3 mt-8">
        <div className="container mx-auto px-4 text-center text-xs md:text-sm">
          <p>برنامج صناديق خاصة وموازنة أعضاء هيئة التدريس ومعاونيهم</p>
          <p className="opacity-80">
            تصميم: أ. هشام محمد عيد عبد السلام - مدير كلية الحاسبات والذكاء الاصطناعي - جامعة بني سويف
          </p>
        </div>
      </footer>
    </div>
  )
}
