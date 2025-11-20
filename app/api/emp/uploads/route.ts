import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { getMongoClient, getDbName } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')
    const filter: any = q
      ? { $or: [
          { filename: { $regex: q, $options: 'i' } },
        ] }
      : {}
    const docs = await uploads
      .find(filter, { projection: { records: 0 } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()
    const items = docs.map((d: any) => ({
      _id: d._id?.toString?.() ?? d._id,
      filename: d.filename,
      createdAt: d.createdAt,
      recordCount: d.recordCount,
      approvedCount: d.approvedCount || 0,
      errorCount: d.errorCount || 0,
    }))
    return NextResponse.json({ items })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}


