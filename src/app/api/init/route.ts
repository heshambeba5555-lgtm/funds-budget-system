import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  // Init setting
  const s = await db.setting.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global' },
  })

  // Init dropdowns
  const defaults: Record<string, string[]> = {
    report_names: [
      'صناديق خاصة أعضاء هيئة التدريس ومعاونيهم',
      'موازنة أعضاء هيئة التدريس ومعاونيهم',
      'تقرير الإجازات',
      'تقرير المكافآت',
    ],
    leave_types: ['اعتيادية', 'مرضية', 'خاصة', 'وضع', 'بدون مرتب', 'ساعة', 'مهمة علمية'],
    degrees: ['أستاذ', 'أستاذ مساعد', 'مدرس', 'معيد', 'محاضر', 'مساعد باحث'],
    reward_types: ['جودة', 'تدريس', 'ساعات زائدة', 'فروق 90 يوم', '200%'],
    administrations: ['شئون أعضاء هيئة التدريس', 'شئون المعاونين', 'البعثات', 'الأبحاث', 'الدراسات العليا'],
    jobs: ['أستاذ', 'أستاذ مساعد', 'مدرس', 'معيد', 'إداري', 'فني'],
  }

  for (const key in defaults) {
    const existing = await db.dropdown.count({ where: { key } })
    if (existing === 0) {
      await db.$transaction(
        defaults[key].map((value, i) =>
          db.dropdown.create({ data: { key, value, order: i } })
        )
      )
    }
  }

  // Init admin user
  const adminCount = await db.user.count()
  if (adminCount === 0) {
    await db.user.create({
      data: {
        name: 'هشام محمد عيد عبد السلام',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        permissions: JSON.stringify({
          settings: ['read', 'write'],
          users: ['read', 'write'],
          leaves: ['read', 'write'],
          data: ['read', 'write'],
          reports: ['read', 'write'],
          comparison: ['read', 'write'],
        }),
        active: true,
      },
    })
  }

  return NextResponse.json({ ok: true, setting: s })
}
