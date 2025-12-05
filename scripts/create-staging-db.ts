#!/usr/bin/env node
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') })

import { getMongoClient } from '../lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const BATCH_SIZE = 10000 // For large collections

interface CopyResult {
  collection: string
  sourceCount: number
  targetCountBefore: number
  targetCountAfter: number
  copiedCount: number
  duration: number
  success: boolean
  error?: string
}

interface CopyReport {
  timestamp: string
  sourceDb: string
  targetDb: string
  results: CopyResult[]
  totalCopied: number
  totalDuration: number
  success: boolean
}

async function copyCollection(
  sourceDb: any,
  targetDb: any,
  collectionName: string
): Promise<CopyResult> {
  const startTime = Date.now()

  try {
    console.log(`\n🔄 Copying collection: ${collectionName}`)

    const sourceCollection = sourceDb.collection(collectionName)
    const targetCollection = targetDb.collection(collectionName)

    // Get counts
    const sourceCount = await sourceCollection.countDocuments()
    const targetCountBefore = await targetCollection.countDocuments()

    console.log(`   Source documents: ${sourceCount}`)
    console.log(`   Target documents (before): ${targetCountBefore}`)

    if (sourceCount === 0) {
      console.log(`   ⚠️  Source collection is empty, skipping...`)
      return {
        collection: collectionName,
        sourceCount,
        targetCountBefore,
        targetCountAfter: targetCountBefore,
        copiedCount: 0,
        duration: Date.now() - startTime,
        success: true,
      }
    }

    // Copy indexes first
    console.log(`   📋 Copying indexes...`)
    const indexes = await sourceCollection.indexes()
    for (const index of indexes) {
      // Skip the default _id index
      if (index.name === '_id_') continue

      try {
        const { name, key, ...options } = index
        await targetCollection.createIndex(key, { name, ...options })
        console.log(`   ✅ Created index: ${name}`)
      } catch (error: any) {
        // Index might already exist, which is fine
        if (error.code !== 85 && error.code !== 86) {
          console.log(`   ⚠️  Index creation warning: ${error.message}`)
        }
      }
    }

    // Use aggregation pipeline with $merge for efficient copying
    console.log(`   📤 Starting copy using $merge aggregation...`)

    // Check if collection is large (>100K docs) - use batched approach
    if (sourceCount > 100000) {
      console.log(`   📊 Large collection detected, using batched copy...`)

      let copiedTotal = 0
      for (let skip = 0; skip < sourceCount; skip += BATCH_SIZE) {
        const batch = Math.min(BATCH_SIZE, sourceCount - skip)
        console.log(`   📦 Processing batch: ${skip + 1}-${skip + batch} of ${sourceCount}`)

        await sourceCollection
          .aggregate([
            { $skip: skip },
            { $limit: BATCH_SIZE },
            {
              $merge: {
                into: { db: targetDb.databaseName, coll: collectionName },
                whenMatched: 'replace', // Replace existing documents
                whenNotMatched: 'insert', // Insert new documents
              },
            },
          ])
          .toArray()

        copiedTotal += batch
        const progress = ((copiedTotal / sourceCount) * 100).toFixed(1)
        console.log(`   ✅ Progress: ${progress}%`)
      }
    } else {
      // Small collection - copy all at once
      await sourceCollection
        .aggregate([
          {
            $merge: {
              into: { db: targetDb.databaseName, coll: collectionName },
              whenMatched: 'replace', // Replace existing documents
              whenNotMatched: 'insert', // Insert new documents
            },
          },
        ])
        .toArray()
    }

    // Get new count
    const targetCountAfter = await targetCollection.countDocuments()
    const copiedCount = targetCountAfter

    const duration = Date.now() - startTime
    console.log(`   ✅ Copy completed in ${(duration / 1000).toFixed(2)}s`)
    console.log(`   Target documents (after): ${targetCountAfter}`)

    return {
      collection: collectionName,
      sourceCount,
      targetCountBefore,
      targetCountAfter,
      copiedCount,
      duration,
      success: true,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`   ❌ Copy failed: ${error.message}`)

    return {
      collection: collectionName,
      sourceCount: 0,
      targetCountBefore: 0,
      targetCountAfter: 0,
      copiedCount: 0,
      duration,
      success: false,
      error: error.message,
    }
  }
}

async function createStagingDatabase(dryRun: boolean = false) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').slice(0, -5)

  console.log('🚀 Create Staging Database Script')
  console.log('===================================\n')

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be copied\n')
  }

  try {
    // Connect to MongoDB
    const client = await getMongoClient()
    const sourceDb = client.db('melinux_emp')
    const targetDb = client.db('melinux_emp_stage')

    console.log('✅ Connected to MongoDB')
    console.log(`   Source: melinux_emp`)
    console.log(`   Target: melinux_emp_stage\n`)

    // Get all collections from source database
    const collections = await sourceDb.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    console.log(`📋 Found ${collectionNames.length} collections in source database:`)
    collectionNames.forEach((name) => console.log(`   - ${name}`))
    console.log()

    // If dry run, just show counts and exit
    if (dryRun) {
      console.log('📊 Collection Summary:\n')
      for (const collectionName of collectionNames) {
        const sourceCount = await sourceDb.collection(collectionName).countDocuments()
        const targetCount = await targetDb.collection(collectionName).countDocuments()
        console.log(`   ${collectionName}:`)
        console.log(`      Source: ${sourceCount} documents`)
        console.log(`      Target: ${targetCount} documents`)
        console.log(`      Will copy: ${sourceCount} documents\n`)
      }
      console.log('✅ Dry run completed\n')
      return { success: true, dryRun: true }
    }

    // Perform actual copy
    const report: CopyReport = {
      timestamp,
      sourceDb: 'melinux_emp',
      targetDb: 'melinux_emp_stage',
      results: [],
      totalCopied: 0,
      totalDuration: 0,
      success: true,
    }

    console.log('🔄 Starting copy process...')

    for (const collectionName of collectionNames) {
      const result = await copyCollection(sourceDb, targetDb, collectionName)
      report.results.push(result)
      report.totalCopied += result.copiedCount

      if (!result.success) {
        report.success = false
      }
    }

    report.totalDuration = Date.now() - startTime

    // Save copy report
    const logDir = join(process.cwd(), 'logs')
    await mkdir(logDir, { recursive: true })
    const reportFile = join(logDir, `staging_copy_${timestamp}.json`)
    await writeFile(reportFile, JSON.stringify(report, null, 2), 'utf-8')

    // Print summary
    console.log('\n\n📊 Copy Summary')
    console.log('===============\n')
    console.log(`Total collections: ${report.results.length}`)
    console.log(`Successful: ${report.results.filter((r) => r.success).length}`)
    console.log(`Failed: ${report.results.filter((r) => !r.success).length}`)
    console.log(`Total documents copied: ${report.totalCopied}`)
    console.log(`Total duration: ${(report.totalDuration / 1000).toFixed(2)}s`)
    console.log(`Report saved: ${reportFile}\n`)

    if (!report.success) {
      console.log('⚠️  Some collections failed to copy:\n')
      report.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   ❌ ${r.collection}: ${r.error}`)
        })
      console.log()
    }

    console.log('✅ Staging database created successfully!')
    console.log(`   Database: melinux_emp_stage`)
    console.log(`   Collections: ${report.results.filter((r) => r.success).length}`)
    console.log(`   Total documents: ${report.totalCopied}\n`)

    return report
  } catch (error) {
    console.error('❌ Copy failed:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('-d')

  createStagingDatabase(dryRun)
    .then((result) => {
      if (result.success || result.dryRun) {
        console.log('✅ Script completed successfully')
        process.exit(0)
      } else {
        console.log('⚠️  Script completed with errors')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { createStagingDatabase }
