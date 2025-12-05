#!/usr/bin/env node
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })

import { getMongoClient } from '../lib/db'

async function listDatabases() {
  try {
    const client = await getMongoClient()
    const adminDb = client.db('admin')
    const result = await adminDb.admin().listDatabases()

    console.log('\n📊 MongoDB Databases:\n')
    console.log('Name                    | Size (MB) | Collections')
    console.log('------------------------|-----------|------------')

    for (const db of result.databases) {
      const sizeInMB = (db.sizeOnDisk / (1024 * 1024)).toFixed(2)
      const dbInstance = client.db(db.name)
      const collections = await dbInstance.listCollections().toArray()
      console.log(`${db.name.padEnd(23)} | ${sizeInMB.padStart(9)} | ${collections.length}`)
    }

    console.log('\n✅ List completed\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

listDatabases().then(() => process.exit(0))
