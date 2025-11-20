# Edit & Retry Transactions Feature

## Overview

This feature allows you to **edit individual transactions** that have errors, **fetch detailed error messages** from emerchantpay, and **re-submit** fixed transactions.

## 🎯 Problem Solved

When transactions fail in emerchantpay (like the parsing error you saw: "Parsing acquirer response failed: no data received"), you can now:

1. ✅ See the exact error message from EMP in your system
2. ✏️ Edit the transaction data to fix issues (e.g., fix IBAN, amount, name)
3. 🔄 Re-submit the corrected transaction
4. 👁️ Track which rows have been edited and when

## Features Added

### 1. Error Message Sync
When you click **"Reconcile"**, the system now:
- Fetches transaction status from emerchantpay
- Pulls the full error messages (e.g., "Parsing acquirer response failed: no data received")
- Stores these errors in your database
- Displays them below each failed row

### 2. Edit Individual Rows
For each transaction row:
- **"Edit" button** opens a dialog with all fields
- Edit any field (IBAN, amount, name, etc.)
- Save changes
- Row status resets to "pending" (ready to re-submit)
- Timestamp of edit is recorded

### 3. Retry Failed Transactions
- **"Retry" button** appears on error/pending rows
- Re-submits the single transaction to emerchantpay
- Updates status based on new response
- Works with both edited and non-edited rows

### 4. Visual Error Display
- Red rows for errors
- Error message displayed below the row with alert icon
- Shows the exact technical message from emerchantpay

## How to Use

### Fix a Failed Transaction

#### Step 1: Open the Upload
Navigate to the upload with errors and click "View"

#### Step 2: Reconcile to Fetch Errors
Click **"Reconcile"** button at the top to fetch the latest status and error messages from emerchantpay

#### Step 3: Identify the Problem
Look for red rows with error messages displayed below them, for example:
```
⚠️ Error: Parsing acquirer response failed: no data received
```

#### Step 4: Edit the Row
1. Click the **"Edit"** button on the error row
2. A dialog opens with all fields
3. Fix the problematic data (e.g., correct the IBAN, amount, or name)
4. Click **"Save Changes"**
5. The row turns gray (pending status)

#### Step 5: Re-Submit
Click the **"Retry"** button on the edited row to re-submit just that transaction

#### Step 6: Verify
Wait a moment, then click **"Reconcile"** again to see if it was approved

### Example: Fix IBAN Error

**Original Error:**
```
Row: Ilona Klug, 89.00 EUR, DE98850503004122618814
Error: Invalid IBAN format
```

**Steps:**
1. Click "Edit" on this row
2. Correct the IBAN field to: `DE98850503004122618815`
3. Click "Save Changes"
4. Click "Retry"
5. Click "Reconcile" to verify it's now approved ✅

## API Endpoints

### `PUT /api/emp/edit-row/[uploadId]/[rowIndex]`
Edit a single row's data.

**Request:**
```json
{
  "updatedRecord": {
    "Given": "Ilona",
    "Family": "Klug",
    "Iban": "DE98850503004122618815",
    "ProduktPreis": "89.00",
    ...
  }
}
```

**Response:**
```json
{
  "ok": true
}
```

**Database Changes:**
- Updates `records[rowIndex]` with new data
- Sets `rows[rowIndex].status` to "pending"
- Sets `rows[rowIndex].edited` to `true`
- Sets `rows[rowIndex].editedAt` to current timestamp

### Enhanced Reconcile Endpoint
The existing `/api/emp/reconcile/[id]` now also:
- Stores `empError` for each row
- Stores `empStatus` for each row

## Database Schema Updates

### Upload Document
```javascript
{
  _id: ObjectId("..."),
  filename: "Buchung.csv",
  records: [
    { Given: "Ilona", Family: "Klug", Iban: "DE98...", ... }
  ],
  rows: [
    {
      status: "error",              // pending | approved | error
      edited: true,                 // true if row has been edited
      editedAt: ISODate("..."),     // when it was edited
      empError: "Parsing acquirer response failed: no data received",
      empStatus: "error",           // status from EMP
      emp: {
        uniqueId: "abc123",
        message: "Error",
        technicalMessage: "Parsing acquirer response failed: no data received"
      }
    }
  ]
}
```

## UI Components

### 1. `EditRowDialog`
- Modal dialog with form fields for all CSV columns
- Input for each field
- Save/Cancel buttons
- Triggers page refresh on save

### 2. Enhanced `TableClient`
- Shows error messages below failed rows
- "Edit" button on every row
- "Retry" button on non-approved rows
- Actions column on the right
- Color-coded rows (green/red/gray)

### 3. `UploadDetailClient`
- Client component wrapper for upload detail page
- Handles page refresh after edits
- Passes error messages and upload ID to table

## Example Error Messages from EMP

Common errors you might see:

1. **"Parsing acquirer response failed: no data received"**
   - Network/timeout issue
   - Retry might work

2. **"Invalid IBAN"**
   - Fix the IBAN field
   - Check for typos or incorrect format

3. **"Invalid amount"**
   - Fix the ProduktPreis field
   - Ensure it's a valid number

4. **"Missing required field: customer_email"**
   - Add email to the Email field

5. **"Duplicate transaction_id"**
   - Transaction was already submitted
   - Check if it's actually approved

## Workflow for Batch Error Fixing

### Scenario: 10 failed transactions out of 2000

1. Click **"Reconcile"** → See "1990 approved, 10 errors"
2. Scroll through red rows or search for them
3. For each error:
   - Read the error message
   - Click "Edit"
   - Fix the issue
   - Click "Save"
   - Click "Retry"
4. After fixing all 10, click **"Reconcile"** again
5. Should now show "2000 approved, 0 errors" ✅

## Tips

- **Always reconcile first** before editing to get the latest error messages
- **Edit one at a time** for better tracking
- **Reconcile after retries** to verify success
- **Error messages are cached** in your database, so you don't lose them
- **Edited rows are marked** with `edited: true` for audit purposes

## Future Enhancements

Potential improvements:
- **Bulk edit**: Edit multiple rows at once
- **CSV re-upload**: Upload a corrected CSV to replace failed rows
- **Error patterns**: Auto-detect common errors and suggest fixes
- **Validation**: Pre-validate before submission to catch errors early
- **History**: Track all edit history for each row

