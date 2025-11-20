import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongoClient, getDbName } from '@/lib/db'

export const runtime = 'nodejs'

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')
    const id = new ObjectId(ctx.params.id)
    await uploads.deleteOne({ _id: id })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}


