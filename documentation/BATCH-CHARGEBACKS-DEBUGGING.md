# Batch Chargeback Analysis - Dynamic Data & Debugging Guide

## Issue: Numbers Don't Match

### The Problem
```
Total Chargebacks shown: 3,641
Sum of batch chargebacks: 569 + 375 + 91 + 90 + 41 = 1,166
Missing: 3,641 - 1,166 = 2,475 chargebacks! ❌
```

## Root Cause: Unmatched Chargebacks

The system was showing **ALL chargebacks in the database** (3,641), but only **1,166 were matched to upload batches**.

### Why Chargebacks Don't Match

**2,475 chargebacks couldn't be linked because:**

1. **Transaction not in `emp_reconcile_transactions` cache**
   - Chargeback exists in `emp_chargebacks`
   - But corresponding transaction not synced to reconcile cache
   - Solution: Click "Resync Tx" on main analytics page

2. **Transaction ID not in any upload batch**
   - Transaction exists in reconcile
   - But `baseTransactionId` not found in any `upload.rows[]`
   - Possible causes:
     - Batch upload was deleted
     - Transaction processed outside of batch system
     - Transaction predates batch uploads

3. **Mismatched transaction IDs**
   - Transaction ID format changed
   - Different transaction ID formats between systems

## Solution Implemented

### 1. ✅ Show Only Matched Chargebacks in KPIs

**Before:**
```typescript
totalChargebacks: allChargebacks.length // Shows 3,641 ❌
```

**After:**
```typescript
totalChargebacks: matchedChargebackIds.size // Shows 1,166 ✅
totalChargebacksInDb: allChargebacks.length // Shows 3,641 (for reference)
unmatchedChargebacks: 3,641 - 1,166 = 2,475 (warning)
```

### 2. ✅ Track Matched vs Unmatched

```typescript
const matchedChargebackIds = new Set<string>()

// When matching
for (const transactionId of uploadTransactionIds) {
  const chargeback = transactionIdToChargeback.get(transactionId)
  if (chargeback) {
    uploadChargebacks.push(chargeback)
    matchedChargebackIds.add(chargeback.uniqueId) // ← Track match
  }
}

// After all batches
const totalMatched = matchedChargebackIds.size
const totalUnmatched = allChargebacks.length - totalMatched
```

### 3. ✅ Add Warning Banner in UI

Shows when `unmatchedChargebacks > 0`:

```
⚠️ 2,475 Unmatched Chargebacks

Total chargebacks in database: 3,641 • Matched to batches: 1,166 • Not matched: 2,475

These chargebacks could not be linked to any upload batch. Possible reasons: 
transaction not in reconcile cache, transaction ID not in upload, or batch was deleted.
```

### 4. ✅ Comprehensive Console Logging

**Backend logs:**
```
[Batch Chargebacks] Found 3641 chargebacks
[Batch Chargebacks] Looking up 3641 chargeback transactions in reconcile
[Batch Chargebacks] Found 3200 matching transactions in reconcile
[Batch Chargebacks] Mapped 3200 chargebacks to transaction IDs
[Batch Chargebacks] Sample upload has 2124 transaction IDs
[Batch Chargebacks] First 3 transaction IDs: ['shp-...', 'shp-...', 'shp-...']
[Batch Chargebacks] First 3 chargeback transaction IDs: ['shp-...', 'shp-...', 'shp-...']
[Batch Chargebacks] Upload Buchung Grandluckservice.csv: 569 chargebacks matched
[Batch Chargebacks] Analysis complete: 5 batches analyzed
[Batch Chargebacks] Total chargebacks in DB: 3641
[Batch Chargebacks] Matched to batches: 1166
[Batch Chargebacks] Unmatched (no batch found): 2475
⚠️ 2475 chargebacks could not be matched to any batch!
[Batch Chargebacks] Possible reasons:
  - Transaction not in reconcile cache
  - Transaction ID not in any upload batch
  - Batch upload was deleted
[Batch Chargebacks] Sample unmatched chargebacks: [...]
```

**Frontend logs:**
```
[Batch Chargebacks UI] Data loaded at: 2025-11-08T15:30:45.123Z
[Batch Chargebacks UI] Total chargebacks (matched): 1166
[Batch Chargebacks UI] Total in DB: 3641
[Batch Chargebacks UI] Unmatched: 2475
⚠️ 2475 chargebacks could not be matched to any batch
```

### 5. ✅ Force Dynamic Data (No Caching)

**Backend:**
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0

response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
response.headers.set('Pragma', 'no-cache')
response.headers.set('Expires', '0')
```

**Frontend:**
```typescript
const timestamp = new Date().getTime()
fetch(`/api/emp/analytics/batch-chargebacks?t=${timestamp}`, {
  cache: 'no-store',
  headers: { 'Cache-Control': 'no-cache' },
})
```

## Expected Results

### After Resyncing Cache

**Step 1: Resync on main page**
- Go to `/emp/analytics`
- Click **"Resync CB"** → Wait for completion
- Click **"Resync Tx"** → Wait for completion

**Step 2: Check batch chargebacks**
- Go to `/emp/analytics/batch-chargebacks`
- Click **"Refresh"**

### Expected Numbers

**If all 3,641 chargebacks match:**
```
✅ Total Chargebacks: 3,641 (matched)
✅ Sum of batches: 3,641
✅ No warning banner
```

**If only 1,166 match (current state):**
```
✅ Total Chargebacks: 1,166 (matched to batches)
⚠️ Warning: 2,475 unmatched chargebacks
📊 Total in DB: 3,641
```

## Debugging Workflow

### 1. Check Console Logs (Backend)

Look for these lines in server logs:
```bash
npm run dev
# Watch for:
# - "Found X chargebacks"
# - "Found X matching transactions in reconcile"
# - "Mapped X chargebacks to transaction IDs"
# - "Unmatched (no batch found): X"
```

### 2. Check Browser Console (Frontend)

Open DevTools Console and look for:
```javascript
// After clicking Refresh
[Batch Chargebacks UI] Data loaded at: ...
[Batch Chargebacks UI] Total chargebacks (matched): X
[Batch Chargebacks UI] Total in DB: Y
[Batch Chargebacks UI] Unmatched: Z
```

### 3. Investigate Sample Unmatched Chargebacks

Server logs show sample unmatched chargebacks:
```javascript
[Batch Chargebacks] Sample unmatched chargebacks: [
  { uniqueId: 'abc123...', amount: 8900, postDate: '2025-11-03' },
  { uniqueId: 'def456...', amount: 8900, postDate: '2025-11-03' },
  { uniqueId: 'ghi789...', amount: 8900, postDate: '2025-11-03' }
]
```

**Next steps:**
1. Copy a `uniqueId` from unmatched list
2. Check if it exists in `emp_reconcile_transactions`:
   ```javascript
   db.emp_reconcile_transactions.findOne({ uniqueId: "abc123..." })
   ```
3. If found, check its `transactionId`
4. Search that `transactionId` in all `uploads`:
   ```javascript
   db.uploads.find({ "rows.baseTransactionId": "shp-..." })
   ```
5. If not found → chargeback has no associated batch

### 4. Compare Transaction ID Formats

**From upload rows:**
```javascript
rows[0].baseTransactionId // e.g., "shp-mhdilyg8-00049"
```

**From chargebacks (via reconcile):**
```javascript
// Should match format above
reconcile.transactionId // e.g., "shp-mhdilyg8-00049"
```

If formats don't match, that's the issue!

## Data Flow

```
1. emerchantpay Chargebacks API
   ↓ (Resync CB)
2. MongoDB: emp_chargebacks collection
   └─ uniqueId: "c8239a054c35..."
         ↓
3. MongoDB: emp_reconcile_transactions
   └─ uniqueId: "c8239a054c35..." ✅ MATCH
   └─ transactionId: "shp-mhdilyg8-00049"
         ↓
4. MongoDB: uploads.rows[]
   └─ baseTransactionId: "shp-mhdilyg8-00049" ✅ MATCH
   └─ Found in batch: "buchungen Bestwin_FRST.csv"
```

If any step breaks, the chargeback becomes "unmatched".

## API Response Structure

```typescript
{
  success: true,
  batches: [
    {
      uploadId: "...",
      filename: "Buchung Grandluckservice.csv",
      totalRecords: 2124,
      approvedCount: 2124,
      chargebackCount: 569,  // Matched chargebacks only
      chargebackRate: "26.79%",
      chargebackAmount: 5064100,  // in cents
      chargebacks: [...]
    },
    // ... more batches
  ],
  totalBatches: 5,
  totalChargebacks: 1166,        // ← MATCHED to batches
  totalChargebacksInDb: 3641,    // ← TOTAL in database
  unmatchedChargebacks: 2475,    // ← Could not link to batch
  timestamp: "2025-11-08T15:30:45.123Z"
}
```

## Verification

### Numbers Must Add Up

```javascript
// Sum of all batch chargebacks
const sumFromBatches = batches.reduce((sum, b) => sum + b.chargebackCount, 0)

// Should equal totalChargebacks
console.assert(sumFromBatches === totalChargebacks)

// Total in DB
console.assert(totalChargebacks + unmatchedChargebacks === totalChargebacksInDb)
```

### Example (Current State)
```
569 + 375 + 91 + 90 + 41 = 1,166 ✅ (sum matches totalChargebacks)
1,166 + 2,475 = 3,641 ✅ (matched + unmatched = total)
```

## Solutions for Unmatched Chargebacks

### Option 1: Resync All Data (Recommended)
1. Go to `/emp/analytics`
2. Click "Resync CB" and wait
3. Click "Resync Tx" and wait
4. Refresh batch chargebacks page

### Option 2: Investigate Missing Transactions
1. Export unmatched chargeback `uniqueId`s
2. Query reconcile API directly for those transactions
3. Check if they exist but weren't cached
4. Manually add to reconcile cache if needed

### Option 3: Accept Unmatched (If Intentional)
- Some chargebacks may legitimately not have batches
- E.g., manual transactions, old data, deleted batches
- Warning banner informs users of the situation
- Totals show only matched chargebacks (accurate for batch analysis)

---

**Status**: ✅ **FIXED - All data now dynamic, with proper tracking and debugging**

- ✅ Only matched chargebacks shown in totals
- ✅ Warning banner for unmatched chargebacks
- ✅ Comprehensive logging for debugging
- ✅ No caching issues
- ✅ Numbers add up correctly

