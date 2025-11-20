# EMP Reconciliation Feature

## Overview

This feature allows you to **reconcile** your CSV uploads with emerchantpay by fetching transaction statuses from their API and comparing them with what you've submitted. This helps you verify:

- ✅ Which transactions were approved
- ⏳ Which are still pending
- ❌ Which failed or had errors
- 📤 Which haven't been submitted yet
- ⚠️ Which were submitted but are missing in EMP

## How It Works

### 1. Transaction Retrieval
The system uses emerchantpay's **`reconcile`** transaction type (via `genesis.js` SDK) to fetch the current status of each transaction by its `unique_id`.

### 2. Batch Processing
To avoid overwhelming the API, transactions are reconciled in batches of 5 at a time.

### 3. Status Comparison
The system compares:
- **CSV records** (what you intended to send)
- **Local database** (what you've submitted and stored)
- **EMP API** (what emerchantpay actually has)

### 4. Report Generation
A detailed report shows:
- Total transactions
- Approved count
- Pending count
- Error count
- Not submitted count
- List of transactions missing in EMP

## How to Use

### From Dashboard (`/emp`)
1. Find the upload you want to reconcile
2. Click the **"Reconcile"** button (blue checkmark icon)
3. Wait for the reconciliation to complete
4. A toast notification will show the summary

### From Upload Detail Page (`/emp/uploads/[id]`)
1. Open an upload
2. Click the **"Reconcile"** button (outline style)
3. The page will refresh and show a **Reconciliation Report** card with:
   - Total, Approved, Pending, Errors, Not Submitted counts
   - Warning if any transactions are missing in EMP
   - Timestamp of last reconciliation

## API Endpoints

### `POST /api/emp/reconcile/[id]`
Reconciles an upload by fetching all submitted transactions from EMP.

**Response:**
```json
{
  "ok": true,
  "report": {
    "total": 100,
    "submitted": 80,
    "approved": 75,
    "pending": 3,
    "error": 2,
    "notSubmitted": 20,
    "missingInEmp": ["tx-123", "tx-456"],
    "details": [
      {
        "csvRowIndex": 0,
        "transactionId": "tx-123",
        "status": "approved",
        "empStatus": "success"
      }
    ]
  }
}
```

## Files Added/Modified

### New Files
- **`lib/emerchantpay-reconcile.ts`**: Core reconciliation logic
  - `reconcileTransaction()` - Fetch single transaction status
  - `reconcileTransactions()` - Fetch multiple transaction statuses
  - `compareWithEmp()` - Compare CSV with EMP and generate report
  
- **`app/api/emp/reconcile/[id]/route.ts`**: API endpoint for reconciliation

### Modified Files
- **`app/emp/page.tsx`**: Added "Reconcile" button to dashboard
- **`app/emp/uploads/[id]/page.tsx`**: Added "Reconcile" button and report display

## Data Storage

The reconciliation report is stored in MongoDB:
```javascript
{
  _id: ObjectId("..."),
  filename: "Buchung.csv",
  records: [...],
  rows: [...],
  lastReconciledAt: ISODate("2025-10-17T12:00:00Z"),
  reconciliationReport: {
    total: 100,
    approved: 75,
    pending: 3,
    error: 2,
    notSubmitted: 20,
    missingInEmp: [],
    details: [...]
  }
}
```

## Use Cases

### 1. Verification After Sync
After clicking "Sync with EMP", click "Reconcile" to verify all transactions were received and processed correctly.

### 2. Daily/Periodic Checks
Reconcile uploads periodically to check if pending transactions have been approved or if any errors occurred.

### 3. Debugging Missing Transactions
If the reconciliation report shows transactions in `missingInEmp`, it means they were submitted but emerchantpay has no record. This could indicate:
- Network issues during submission
- API errors that weren't properly logged
- Transaction IDs were not stored correctly

### 4. Audit Trail
The `lastReconciledAt` timestamp and stored report provide an audit trail of when checks were performed.

## Technical Notes

### Genesis SDK Integration
The reconciliation uses the same `genesis.js` SDK configuration as the submission process:
- Username: `EMP_GENESIS_USERNAME`
- Password: `EMP_GENESIS_PASSWORD`
- Terminal Token: `EMP_GENESIS_TERMINAL_TOKEN`
- Endpoint: `EMP_GENESIS_ENDPOINT`

### Error Handling
If a transaction can't be reconciled (e.g., not found in EMP), it's marked as `missing_in_emp` rather than failing the entire process.

### Performance
- Batch size: 5 concurrent requests
- For a 100-transaction upload: ~20 seconds to reconcile all
- For a 2000-transaction upload: ~6-7 minutes

## Next Steps

Future enhancements could include:
- **Auto-reconciliation**: Automatically reconcile after sync completes
- **Scheduled reconciliation**: Cron job to reconcile all uploads daily
- **Detailed drill-down**: Click on each status count to see which specific rows are in that state
- **Export report**: Download reconciliation report as CSV/PDF
- **Notifications**: Email alerts when discrepancies are found

