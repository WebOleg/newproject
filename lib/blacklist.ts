/**
 * Blacklist functionality
 * Check IBANs, emails, and names against blacklist collection
 */
import { getMongoClient } from './db'

export interface BlacklistEntry {
  iban?: string
  ibanMasked?: string
  name?: string
  email?: string
  bic?: string
  reason?: string
  createdAt: Date
  createdBy?: string
}

export interface BlacklistCheckResult {
  blacklistedIbans: Set<string>
  blacklistedEmails: Set<string>
  blacklistedNames: Set<string>
  blacklistedBics: Set<string>
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
 * Check multiple emails against blacklist
 * Returns set of blacklisted emails (lowercase)
 */
export async function getBlacklistedEmails(emails: string[]): Promise<Set<string>> {
  if (!emails.length) return new Set()
  
  const client = await getMongoClient()
  const db = client.db(process.env.MONGODB_DB || 'melinux_emp_stage')
  
  const normalizedEmails = emails.map(e => e.trim().toLowerCase())
  
  // Case-insensitive search
  const entries = await db.collection('blacklist')
    .find({ 
      email: { 
        $in: normalizedEmails.map(e => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
      } 
    })
    .toArray()
  
  return new Set(entries.map(e => e.email?.toLowerCase()).filter(Boolean))
}

/**
 * Check multiple names against blacklist
 * Returns set of blacklisted names (uppercase)
 */
export async function getBlacklistedNames(names: string[]): Promise<Set<string>> {
  if (!names.length) return new Set()
  
  const client = await getMongoClient()
  const db = client.db(process.env.MONGODB_DB || 'melinux_emp_stage')
  
  const normalizedNames = names.map(n => n.trim().toUpperCase())
  
  // Case-insensitive search
  const entries = await db.collection('blacklist')
    .find({ 
      name: { 
        $in: normalizedNames.map(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
      } 
    })
    .toArray()
  
  return new Set(entries.map(e => e.name?.toUpperCase()).filter(Boolean))
}

/**
 * Check if BIC contains blacklisted pattern
 */
export async function getBlacklistedBics(bics: string[]): Promise<Set<string>> {
  if (!bics.length) return new Set()
  
  const client = await getMongoClient()
  const db = client.db(process.env.MONGODB_DB || 'melinux_emp_stage')
  
  // Get all blacklisted BIC patterns
  const blacklistBics = await db.collection('blacklist')
    .find({ bic: { $exists: true, $ne: null } })
    .toArray()
  
  const blacklistedPatterns = blacklistBics.map(e => e.bic?.toUpperCase()).filter(Boolean)
  
  // Check each BIC against patterns
  const result = new Set<string>()
  for (const bic of bics) {
    const normalizedBic = bic.trim().toUpperCase()
    for (const pattern of blacklistedPatterns) {
      if (normalizedBic.includes(pattern)) {
        result.add(normalizedBic)
        break
      }
    }
  }
  
  return result
}

/**
 * Check all fields against blacklist in one call
 */
export async function checkBlacklist(
  ibans: string[],
  emails: string[],
  names: string[],
  bics: string[] = []
): Promise<BlacklistCheckResult> {
  const [blacklistedIbans, blacklistedEmails, blacklistedNames, blacklistedBics] = await Promise.all([
    getBlacklistedIbans(ibans),
    getBlacklistedEmails(emails),
    getBlacklistedNames(names),
    getBlacklistedBics(bics)
  ])
  
  return {
    blacklistedIbans,
    blacklistedEmails,
    blacklistedNames,
    blacklistedBics
  }
}

/**
 * Add entry to blacklist
 */
export async function addToBlacklist(entry: BlacklistEntry): Promise<boolean> {
  const client = await getMongoClient()
  const db = client.db(process.env.MONGODB_DB || 'melinux_emp_stage')
  
  try {
    const doc: any = {
      ...entry,
      createdAt: new Date()
    }
    
    if (entry.iban) {
      doc.iban = entry.iban.replace(/\s/g, '').toUpperCase()
    }
    if (entry.email) {
      doc.email = entry.email.trim().toLowerCase()
    }
    if (entry.name) {
      doc.name = entry.name.trim().toUpperCase()
    }
    
    await db.collection('blacklist').insertOne(doc)
    return true
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('Entry already blacklisted:', entry)
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
