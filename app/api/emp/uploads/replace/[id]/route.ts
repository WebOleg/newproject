import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongoClient, getDbName } from '@/lib/db'
import { parseEmpCsv } from '@/lib/emp'

export const runtime = 'nodejs'

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    const text = await file.text()
    const records = parseEmpCsv(text)
    const headers = records[0] ? Object.keys(records[0]) : []

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')
    const id = new ObjectId(ctx.params.id)
    await uploads.updateOne({ _id: id }, {
      $set: {
        filename: (file as File).name,
        records,
        headers,
        recordCount: records.length,
        rows: records.map(() => ({ status: 'pending', attempts: 0 })),
        updatedAt: new Date(),
      }
    })
    return NextResponse.json({ ok: true, count: records.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}


