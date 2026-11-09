import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/rewards - list all rewards
// GET /api/rewards?type=degree - filter by type
// GET /api/rewards?type=degree&name=مدرس - get specific
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const type = sp.get('type')
  const name = sp.get('name')
  const where: Record<string, unknown> = {}
  if (type) where.type = type
  if (name) where.name = name

  const items = await db.reward.findMany({
    where,
    orderBy: [{ type: 'asc' }, { name: 'asc' }, { category: 'asc' }],
  })
  return NextResponse.json(items)
}

// POST - create a reward
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.type || !body.name || !body.category) {
    return NextResponse.json({ error: 'type, name, category required' }, { status: 400 })
  }
  try {
    const item = await db.reward.upsert({
      where: {
        type_name_category: {
          type: body.type,
          name: body.name,
          category: body.category,
        },
      },
      update: {
        rewardType: body.rewardType || 'fixed',
        amount: String(body.amount ?? '0'),
      },
      create: {
        type: body.type,
        name: body.name,
        category: body.category,
        rewardType: body.rewardType || 'fixed',
        amount: String(body.amount ?? '0'),
      },
    })
    return NextResponse.json(item)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// PUT - update a reward
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const clean: Record<string, unknown> = {}
  if (data.rewardType !== undefined) clean.rewardType = data.rewardType
  if (data.amount !== undefined) clean.amount = String(data.amount)
  if (data.name !== undefined) clean.name = data.name
  if (data.type !== undefined) clean.type = data.type
  if (data.category !== undefined) clean.category = data.category
  const item = await db.reward.update({ where: { id }, data: clean })
  return NextResponse.json(item)
}

// DELETE - delete a reward
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.reward.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
