/**
 * Blacklist functionality
 * Check IBANs against blacklist collection
 */

import { getMongoClient } from './db'

export interface BlacklistEntry {
  iban: string
  ibanMasked?: string
  name?: string
  email?: string
  reason?: string
  createdAt: Date
  createdBy?: string
}

/**
 * Check if IBAN is blacklisted
 */
export async function isBlacklisted(iban: string): Promise<boolean> {
  if (!iban) return false
  
  const client = await getMongoClient()
  const db = client.db(process.env.MONGODB_DB || 'melinux_emp_stage')
  
  const entry = await db.collection('blacklist').findOne({
    iban: iban.replace(/\s/g, '').toUpperCase()
  })
  
  return !!entry
}

/**
 * Check multiple IBANs against blacklist
 * Returns set of blacklisted IBANs
 */
export async function getBlacklistedIbans(ibans: string[]): Promise<Set<string>> {
  if (!ibans.length) return new Set()
  
  const client = await getMongoClient()
  const db = client.db(process.env.MONGODB_DB || 'melinux_emp_stage')
  
  const normalizedIbans = ibans.map(i => i.replace(/\s/g, '').toUpperCase())
  
  const entries = await db.collection('blacklist')
    .find({ iban: { $in: normalizedIbans } })
    .toArray()
  
  return new Set(entries.map(e => e.iban))
}

/**
 * Add IBAN to blacklist
 */
export async function addToBlacklist(entry: BlacklistEntry): Promise<boolean> {
  const client = await getMongoClient()
  const db = client.db(process.env.MONGODB_DB || 'melinux_emp_stage')
  
  try {
    await db.collection('blacklist').insertOne({
      ...entry,
      iban: entry.iban.replace(/\s/g, '').toUpperCase(),
      createdAt: new Date()
    })
    return true
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('IBAN already blacklisted:', entry.iban)
      return false
    }
    throw error
  }
}

/**
 * Remove IBAN from blacklist
 */
export async function removeFromBlacklist(iban: string): Promise<boolean> {
  const client = await getMongoClient()
  const db = client.db(process.env.MONGODB_DB || 'melinux_emp_stage')
  
  const result = await db.collection('blacklist').deleteOne({
    iban: iban.replace(/\s/g, '').toUpperCase()
  })
  
  return result.deletedCount > 0
}
