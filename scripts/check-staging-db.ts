#!/usr/bin/env node
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })

import { getMongoClient } from '../lib/db'

async function checkStagingDatabase() {
  try {
    const client = await getMongoClient()
    const stagingDb = client.db('melinux_emp_stage')

    console.log('\n📋 Collections in melinux_emp_stage:\n')
    console.log('Collection Name                  | Documents')
    console.log('--------------------------------|----------')

    const collections = await stagingDb.listCollections().toArray()

    for (const collection of collections) {
      const count = await stagingDb.collection(collection.name).countDocuments()
      console.log(`${collection.name.padEnd(31)} | ${count}`)
    }

    const totalDocs = await Promise.all(
      collections.map(c => stagingDb.collection(c.name).countDocuments())
    ).then(counts => counts.reduce((a, b) => a + b, 0))

    console.log('--------------------------------|----------')
    console.log(`${'TOTAL'.padEnd(31)} | ${totalDocs}`)
    console.log('\n✅ Check completed\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkStagingDatabase().then(() => process.exit(0))
