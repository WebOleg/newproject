# Batch Chargeback Analysis

## Overview

Track chargebacks by file upload batch to identify problematic IBAN sources and patterns.

## Features

✅ **Batch-Level Analytics**
- Links chargebacks to their originating file uploads
- Shows chargeback rate per batch
- Calculates total chargeback amount per batch
- Sortable by chargeback count (highest first)

✅ **Detailed Chargeback Information**
- Expandable rows show all chargebacks for each batch
- Reason codes with descriptions
- Amount, post date, ARN, and unique ID for each chargeback
- SEPA Direct Debit reason code mappings

✅ **Search & Filter**
- Search by filename or upload ID
- Real-time filtering

✅ **Summary KPIs**
- Total batches analyzed
- Batches affected by chargebacks
- Total chargebacks across all batches
- Total chargebacked amount

## How It Works

### Data Linking

1. **Uploads Collection** (`uploads`)
   - Contains `rows[]` array with transaction metadata
   - Each row stores `emp.uniqueId` when transaction is approved

2. **Chargebacks Collection** (`emp_chargebacks`)
   - Contains chargeback data from emerchantpay API
   - Each chargeback has a `uniqueId` linking to original transaction

3. **Matching Algorithm**
   ```
   For each upload:
     Extract all uniqueIds from rows[].emp.uniqueId
     Match against chargebacks collection by uniqueId
     Calculate statistics
   ```

### API Endpoint

**GET** `/api/emp/analytics/batch-chargebacks`

Returns:
```json
{
  "success": true,
  "batches": [
    {
      "uploadId": "...",
      "filename": "customers_batch_1.csv",
      "createdAt": "2025-11-07T...",
      "totalRecords": 100,
      "approvedCount": 95,
      "chargebackCount": 8,
      "chargebackRate": "8.42%",
      "chargebackAmount": 71200,
      "chargebacks": [...]
    }
  ],
  "totalBatches": 5,
  "totalChargebacks": 435
}
```

## UI Page

**URL**: `/emp/analytics/batch-chargebacks`

### Features:
- **Back Button**: Returns to main analytics dashboard
- **Refresh Button**: Reloads data from database
- **Summary Cards**: Key metrics at a glance
- **Search Bar**: Filter batches by filename
- **Expandable Table**: Click arrow to view detailed chargebacks
- **Color-Coded Rates**:
  - Green: < 2%
  - Yellow: 2-5%
  - Orange: 5-10%
  - Red: ≥ 10%

## Access

From the main analytics dashboard (`/emp/analytics`), click the **"Batch Analysis"** button in the top-right corner.

## Use Cases

### 1. Identify Problem Sources
Find which file uploads have high chargeback rates:
- Sort by chargeback count
- Focus on batches with >10% rate

### 2. Pattern Analysis
Expand high-chargeback batches to see:
- Common reason codes (MD01, SL01, MS03, etc.)
- Whether chargebacks cluster on certain dates
- Specific IBANs that caused issues

### 3. Quality Control
Track chargeback rates over time:
- Compare recent uploads vs older ones
- Identify if data quality is improving
- Flag suspicious patterns early

### 4. Customer Communication
Use detailed chargeback info to:
- Contact customers about failed payments
- Provide specific reason codes
- Reference ARN for disputes

## Example Insights

**High Chargeback Batch:**
```
Filename: customers_oct_batch2.csv
Chargeback Rate: 12.5%
Common Reasons:
  - MD01 (No mandate) - 60%
  - SL01 (Closed account) - 25%
  - MS03 (Invalid signature) - 15%

Action: Review data source for data validation issues
```

**Low Chargeback Batch:**
```
Filename: verified_customers.csv
Chargeback Rate: 0.8%
Common Reasons:
  - AC04 (Insufficient funds) - 100%

Action: This is normal customer behavior, no action needed
```

## Technical Details

### Performance
- Caches all data in MongoDB for fast retrieval
- No API calls needed (reads from cache)
- Handles large batches (tested with 2500+ records)

### Data Refresh
- Data updates when you run "Resync CB" on main dashboard
- Automatically links new chargebacks to existing uploads
- No manual refresh needed

### Scalability
- Handles unlimited number of batches
- Efficiently matches thousands of transactions
- Uses MongoDB indexes for fast lookups

## Next Steps

Potential enhancements:
- Export batch analysis to CSV
- Email alerts for high-chargeback batches
- Historical trending charts
- Batch comparison view
- Auto-flagging of problem IBANs



