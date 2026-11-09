import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const leaves = await db.leave.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(leaves)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const leave = await db.leave.create({
    data: {
      doctorName: body.doctorName || '',
      leaveType: body.leaveType || '',
      fromDate: body.fromDate || '',
      toDate: body.toDate || '',
      degree: body.degree || '',
      conditions: body.conditions || '[]',
      notes: body.notes || '',
    },
  })
  return NextResponse.json(leave)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const leave = await db.leave.update({ where: { id }, data })
  return NextResponse.json(leave)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.leave.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
