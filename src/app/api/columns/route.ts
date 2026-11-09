import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind') || 'funds'
  const cols = await db.columnDef.findMany({
    where: { kind },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(cols)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const col = await db.columnDef.create({
    data: {
      kind: body.kind || 'funds',
      key: body.key,
      label: body.label,
      type: body.type || 'text',
      order: body.order ?? 0,
    },
  })
  return NextResponse.json(col)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.columnDef.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
