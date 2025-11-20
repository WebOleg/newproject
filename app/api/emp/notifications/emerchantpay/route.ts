import { NextResponse } from 'next/server'
import { getMongoClient, getDbName } from '@/lib/db'
import { verifyNotificationSignature } from '@/lib/emerchantpay'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const bodyText = await req.text()
    // Expect application/x-www-form-urlencoded or JSON; handle both simply
    let data: any = {}
    try {
      data = JSON.parse(bodyText)
    } catch {
      data = Object.fromEntries(new URLSearchParams(bodyText))
    }

    const uniqueId = data.unique_id || data.uniqueId
    const status = data.status
    const signature = data.signature || ''
    if (!uniqueId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (!verifyNotificationSignature(uniqueId, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const client = await getMongoClient()
    const db = client.db(getDbName())
    const uploads = db.collection('uploads')

    // Find the row by matching emp.uniqueId
    const doc = await uploads.findOne({ 'rows.emp.uniqueId': uniqueId }) as any
    if (doc) {
      const rows = doc.rows || []
      for (let i = 0; i < rows.length; i++) {
        if (rows[i]?.emp?.uniqueId === uniqueId) {
          rows[i].status = status === 'approved' ? 'approved' : status === 'error' ? 'error' : 'submitted'
          rows[i].emp.message = data.message || rows[i].emp.message
          break
        }
      }
      const approvedCount = rows.filter((r: any) => r.status === 'approved').length
      const errorCount = rows.filter((r: any) => r.status === 'error').length
      await uploads.updateOne({ _id: doc._id }, { $set: { rows, approvedCount, errorCount, updatedAt: new Date() } })
    }

    // Reply per docs (XML with unique_id). Some gateways accept JSON OK too; we return XML for safety.
    const xml = `<?xml version="1.0" encoding="UTF-8"?><notification_echo><unique_id>${uniqueId}</unique_id></notification_echo>`
    return new NextResponse(xml, { status: 200, headers: { 'content-type': 'application/xml' } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}


