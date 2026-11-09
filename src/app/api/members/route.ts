import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind') || 'funds'
  const members = await db.member.findMany({
    where: { kind },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // bulk upsert / replace
  if (Array.isArray(body.items)) {
    const kind = body.kind || 'funds'
    await db.member.deleteMany({ where: { kind } })
    if (body.items.length === 0) return NextResponse.json({ ok: true, count: 0 })
    const created = await db.$transaction(
      body.items.map((item: Record<string, unknown>) => {
        const basic = String(item.basic ?? '')
        const bound = String(item.bound ?? '')
        // Backward-compat: basicSalary = basic + bound (or fallback to item.basicSalary)
        const basicSalary = basic || bound
          ? (basic && bound ? `${basic}+${bound}` : (basic || bound))
          : String(item.basicSalary ?? '')
        return db.member.create({
          data: {
            kind,
            serial: String(item.serial ?? ''),
            code: String(item.code ?? ''),
            basic,
            bound,
            basicSalary,
            exchangeNo: String(item.exchangeNo ?? ''),
            name: String(item.name ?? ''),
            administration: String(item.administration ?? ''),
            degree: String(item.degree ?? ''),
            job: String(item.job ?? ''),
            nationalId: String(item.nationalId ?? ''),
            qualityReward: String(item.qualityReward ?? ''),
            extraHours: String(item.extraHours ?? ''),
            diff90: String(item.diff90 ?? ''),
            teachingReward: String(item.teachingReward ?? ''),
            percent200: String(item.percent200 ?? ''),
            total: String(item.total ?? ''),
            extraColumns: String(item.extraColumns ?? '{}'),
            order: Number(item.order ?? 0),
          },
        })
      })
    )
    return NextResponse.json({ ok: true, count: created.length })
  }
  // single create
  const basic = String(body.basic ?? '')
  const bound = String(body.bound ?? '')
  const basicSalary = basic || bound
    ? (basic && bound ? `${basic}+${bound}` : (basic || bound))
    : String(body.basicSalary ?? '')
  const item = await db.member.create({
    data: {
      kind: body.kind || 'funds',
      serial: String(body.serial ?? ''),
      code: String(body.code ?? ''),
      basic,
      bound,
      basicSalary,
      exchangeNo: String(body.exchangeNo ?? ''),
      name: String(body.name ?? ''),
      administration: String(body.administration ?? ''),
      degree: String(body.degree ?? ''),
      job: String(body.job ?? ''),
      nationalId: String(body.nationalId ?? ''),
      qualityReward: String(body.qualityReward ?? ''),
      extraHours: String(body.extraHours ?? ''),
      diff90: String(body.diff90 ?? ''),
      teachingReward: String(body.teachingReward ?? ''),
      percent200: String(body.percent200 ?? ''),
      total: String(body.total ?? ''),
      extraColumns: String(body.extraColumns ?? '{}'),
      order: Number(body.order ?? 0),
    },
  })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  // Convert all values to strings
  const clean: Record<string, unknown> = {}
  for (const k in data) {
    if (k === 'order') clean[k] = Number(data[k])
    else clean[k] = String(data[k] ?? '')
  }
  const item = await db.member.update({ where: { id }, data: clean })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const { id, kind } = await req.json()
  if (id) {
    await db.member.delete({ where: { id } })
  } else if (kind) {
    await db.member.deleteMany({ where: { kind } })
  }
  return NextResponse.json({ ok: true })
}
