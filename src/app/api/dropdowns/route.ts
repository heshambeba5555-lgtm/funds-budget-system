import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key) {
    const items = await db.dropdown.findMany({
      where: { key },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json(items)
  }
  const all = await db.dropdown.findMany({ orderBy: [{ key: 'asc' }, { order: 'asc' }] })
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const { key, value, order } = await req.json()
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 })
  }
  const item = await db.dropdown.create({
    data: { key, value: String(value), order: order ?? 0 },
  })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest) {
  const { id, value, order } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const data: Record<string, unknown> = {}
  if (value !== undefined) data.value = String(value)
  if (order !== undefined) data.order = Number(order)
  const item = await db.dropdown.update({ where: { id }, data })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.dropdown.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
