import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const users = await db.user.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const user = await db.user.create({
    data: {
      name: body.name,
      username: body.username,
      password: body.password || '123456',
      role: body.role || 'viewer',
      permissions: body.permissions || '{}',
      active: body.active ?? true,
    },
  })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const user = await db.user.update({ where: { id }, data })
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
