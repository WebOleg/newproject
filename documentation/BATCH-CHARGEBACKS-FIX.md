# Batch Chargeback Matching Fix

## Problem

Chargebacks were not being matched to their originating batch uploads because:

1. **Chargeback `uniqueId`** = The uniqueId of the chargeback transaction itself
2. **Upload `row.emp.uniqueId`** = The uniqueId of the original sdd_sale transaction

These are DIFFERENT values, so matching failed (0 matches).

## Solution

Use `original_transaction_unique_id` field from the chargebacks API to link back to the original transaction.

### Changes Made

1. **Updated chargebacks parsing** (`app/api/emp/analytics/chargebacks/route.ts`)
   - Now stores BOTH `uniqueId` (chargeback's own ID) AND `originalTransactionUniqueId` (link to original sdd_sale)

2. **Updated batch matching logic** (`app/api/emp/analytics/batch-chargebacks/route.ts`)
   - Now matches using `originalTransactionUniqueId` instead of `uniqueId`
   - Logs debug info to console

### Required Action: Resync Chargebacks

**YOU MUST RESYNC CHARGEBACKS** for the fix to work:

1. Go to `/emp/analytics`
2. Click **"Resync CB"** button
3. Wait for it to complete
4. Then go to **"Batch Analysis"**

This will re-fetch all chargebacks from the API with the new `originalTransactionUniqueId` field.

### How Matching Works Now

```
Upload Row                          Chargeback
├─ emp.uniqueId: "abc123"          ├─ uniqueId: "xyz789" (chargeback ID)
                    └──────────────┼─ originalTransactionUniqueId: "abc123" ✅ MATCH!
                                   ├─ reasonCode: "MD01"
                                   └─ amount: 8900
```

### Verification

After resyncing, you should see:
- **Console logs** showing:
  - "Created map with X chargebacks linked to original transactions"
  - "Upload XXX: Y chargebacks matched"
- **UI showing**:
  - Non-zero chargeback counts per batch
  - Correct chargeback rates
  - Expandable chargeback details

### Example Output (After Fix)

```
Filename: buchungen Bestwin_FRST.csv
Approved: 1,448
Chargebacks: 127
CB Rate: 8.77%
CB Amount: €112,930.00
```

### Debugging

If still showing 0 chargebacks after resync:

1. Check browser console for logs
2. Check server logs for:
   - "Sample chargeback:" structure
   - "Created map with X chargebacks"
   - "Upload XXX: Y chargebacks matched"
3. Verify uploads have `rows[].emp.uniqueId` populated

### Technical Details

The chargebacks API XML response includes:
```xml
<chargeback_response>
  <unique_id>xyz789</unique_id>  <!-- Chargeback's own ID -->
  <original_transaction_unique_id>abc123</original_transaction_unique_id>  <!-- Link to original -->
  <reason_code>MD01</reason_code>
  ...
</chargeback_response>
```

We now extract and store both IDs, using the `original_transaction_unique_id` for matching.



