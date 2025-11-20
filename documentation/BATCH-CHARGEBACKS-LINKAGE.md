# Batch Chargeback Linkage - How It Works

## The Correct Linkage Chain 🔗

```
1. emp_chargebacks (chargeback data)
   └─ uniqueId: "c8239a054c35c9602974d3433a9507ae"
         ↓
2. emp_reconcile_transactions (transaction data)
   └─ uniqueId: "c8239a054c35c9602974d3433a9507ae" ✅ MATCH!
   └─ bankAccountNumber: "DE83800937840007117639" (IBAN)
         ↓
3. uploads.records (batch upload data)
   └─ Search for IBAN: "DE83800937840007117639" ✅ MATCH!
   └─ Found in batch: "buchungen Bestwin_FRST.csv"
```

## Implementation

### Step 1: Get Chargeback uniqueIds
```javascript
chargebacks.uniqueId → "c8239a054c35c9602974d3433a9507ae"
```

### Step 2: Look Up in Reconcile Transactions
```javascript
emp_reconcile_transactions.find({ 
  uniqueId: "c8239a054c35c9602974d3433a9507ae" 
})
→ bankAccountNumber: "DE83800937840007117639"
```

### Step 3: Search Upload Records by IBAN
```javascript
uploads.records.find((record) => 
  record.IBAN === "DE83800937840007117639"
)
→ Found in upload: "buchungen Bestwin_FRST.csv"
```

## Why This Works

1. **Chargeback uniqueId = Transaction uniqueId**
   - The chargeback's uniqueId IS the original transaction's uniqueId
   - No need for `originalTransactionUniqueId` (that field doesn't exist for most chargebacks)

2. **Transaction contains IBAN**
   - The reconcile transaction has the customer's IBAN/bank account
   - This is the key to linking back to the upload

3. **Upload records contain IBANs**
   - Each CSV upload has customer records with IBANs
   - We can match the chargeback's IBAN to the upload's records

## Database Examples

### emp_chargebacks
```json
{
  "uniqueId": "c8239a054c35c9602974d3433a9507ae",
  "reasonCode": "AC04",
  "reasonDescription": "Account closed",
  "amount": 8900,
  "postDate": "2025-11-03"
}
```

### emp_reconcile_transactions
```json
{
  "uniqueId": "c8239a054c35c9602974d3433a9507ae",
  "type": "sdd_sale",
  "status": "chargebacked",
  "bankAccountNumber": "DE83800937840007117639",
  "amount": 8900,
  "transactionId": "shp-mhdilyg8-00049"
}
```

### uploads.records
```json
{
  "records": [
    {
      "IBAN": "DE83800937840007117639",
      "Name": "John Doe",
      "Amount": "89.00",
      "Reference": "Invoice 12345"
    }
  ]
}
```

## Performance Optimizations

1. **Batch queries instead of loops**
   - Fetch all chargeback uniqueIds at once
   - Query reconcile with `$in` operator
   - Single query for all IBANs

2. **Use Maps for O(1) lookups**
   - `uniqueId → IBAN` mapping
   - `IBAN → chargebacks[]` mapping
   - Fast matching for large datasets

3. **Project only needed fields**
   - Don't fetch full upload records (heavy)
   - Only get what we need for matching

## Code Flow

```typescript
// 1. Get all chargebacks
const chargebacks = await db.collection('emp_chargebacks').find({}).toArray()

// 2. Extract uniqueIds
const uniqueIds = chargebacks.map(cb => cb.uniqueId)

// 3. Get transactions with those uniqueIds (to get IBANs)
const transactions = await db.collection('emp_reconcile_transactions')
  .find({ uniqueId: { $in: uniqueIds } })
  .toArray()

// 4. Create uniqueId -> IBAN map
const uniqueIdToIban = new Map()
transactions.forEach(tx => {
  uniqueIdToIban.set(tx.uniqueId, tx.bankAccountNumber)
})

// 5. Create IBAN -> chargebacks map
const ibanToChargebacks = new Map()
chargebacks.forEach(cb => {
  const iban = uniqueIdToIban.get(cb.uniqueId)
  if (iban) {
    if (!ibanToChargebacks.has(iban)) {
      ibanToChargebacks.set(iban, [])
    }
    ibanToChargebacks.get(iban).push(cb)
  }
})

// 6. For each upload, match by IBANs in records
uploads.forEach(upload => {
  const uploadChargebacks = []
  
  upload.records.forEach(record => {
    const iban = record.IBAN
    const chargebacks = ibanToChargebacks.get(iban)
    if (chargebacks) {
      uploadChargebacks.push(...chargebacks)
    }
  })
  
  // uploadChargebacks now contains all chargebacks for this batch!
})
```

## Why Previous Approach Failed

### ❌ Attempt 1: Direct uniqueId matching
- Tried to match `upload.rows[].emp.uniqueId` to `chargeback.uniqueId`
- Problem: `rows[].emp.uniqueId` is only populated AFTER successful transaction
- For old uploads or failed syncs, this field might be missing

### ❌ Attempt 2: originalTransactionUniqueId
- Tried to use `chargeback.originalTransactionUniqueId`
- Problem: This field doesn't exist in SEPA chargebacks
- It's only for card chargebacks

### ✅ Current Approach: IBAN Linkage
- Uses IBAN as the universal identifier
- IBANs exist in:
  - Original CSV upload (source data)
  - Transaction records (from API response)
  - Easily matched across all collections

## Benefits

1. **Reliable**: IBANs are always present in source data
2. **Fast**: Uses indexes and Map data structures
3. **Scalable**: Handles thousands of records efficiently
4. **Maintainable**: Clear linkage chain, easy to debug
5. **Flexible**: Works with any CSV format (as long as IBAN field exists)

## Testing

To verify the linkage works:

1. Go to `/emp/analytics/batch-chargebacks`
2. Check console logs for:
   - "Mapped X chargebacks to IBANs"
   - "Grouped chargebacks by Y unique IBANs"
   - "Upload XXX: Z chargebacks matched via IBAN"
3. Expand a batch with chargebacks
4. Verify IBAN column shows correct values
5. Cross-reference with original CSV upload

## IBAN Field Name Variations

The code checks multiple possible IBAN field names:
- `IBAN`
- `iban`
- `Iban`
- `BankAccountNumber`
- `bank_account_number`
- `Bank Account Number`
- `IBAN/Account Number`

This ensures compatibility with different CSV formats.



