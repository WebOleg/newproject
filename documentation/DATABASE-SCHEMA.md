# MongoDB Database Schema

This document describes the MongoDB collections and their schemas used in the MeLinux emerchantpay integration platform.

## Table of Contents

- [Database Overview](#database-overview)
- [Collections](#collections)
  - [emp_uploads](#emp_uploads)
  - [emp_reconcile_transactions](#emp_reconcile_transactions)
  - [emp_chargeback_cache](#emp_chargeback_cache)
  - [emp_settings](#emp_settings)
- [Indexes](#indexes)
- [Data Flow](#data-flow)

---

## Database Overview

**Database Name**: `melinux_emp` (configurable via `MONGODB_DB` env var)

**Connection**: MongoDB Atlas (or self-hosted)

**Driver**: Official MongoDB Node.js driver

**Connection Pooling**:
- Max Pool Size: 10
- Min Pool Size: 0
- Socket Timeout: 60 seconds
- Server Selection Timeout: 5 seconds

---

## Collections

### `emp_uploads`

Stores uploaded CSV files and their processing status.

#### Schema

```typescript
{
  _id: ObjectId,
  filename: string,                    // Original filename (e.g., "bestwin_import.csv")
  uploadedAt: Date,                    // Upload timestamp
  uploadedBy: string,                  // User email or ID
  
  // CSV Data
  records: Array<Record<string, string>>,  // Original CSV rows as objects
  totalRecords: number,                // Total row count
  
  // Processing Status
  status: 'pending' | 'processing' | 'completed' | 'failed',
  submittedCount: number,              // Successfully submitted transactions
  successCount: number,                // Approved transactions
  errorCount: number,                  // Failed transactions
  
  // Transaction Tracking
  rows: Array<{
    index: number,
    baseTransactionId: string,         // Generated transaction ID
    status: 'pending' | 'approved' | 'declined' | 'error' | 'voided',
    uniqueId?: string,                 // emerchantpay unique_id
    message?: string,                  // Error message (if any)
    technicalMessage?: string,
    retryCount: number,                // Number of retry attempts
    lastAttemptAt?: Date,              // Last submission attempt
    attempts: Array<{                  // Full attempt history
      attemptNumber: number,
      timestamp: Date,
      transactionId: string,
      status: string,
      uniqueId?: string,
      message?: string,
      technicalMessage?: string
    }>
  }>,
  
  // Statistics
  totalAmount: number,                 // Sum of all transaction amounts (in cents)
  currency: string,                    // Currency code (e.g., EUR)
  
  // Chargeback Filtering
  chargebackFilterStats?: {
    appliedAt: Date,
    originalRowCount: number,
    chargebackedRowCount: number,
    cleanRowCount: number,
    chargebackedIbans: string[]
  },
  
  // Batch Processing
  batchId?: string,                    // Grouped batch identifier
  originalFilename?: string,           // Original filename before renaming
  
  // Metadata
  companyConfig?: {                    // Detected company configuration
    name: string,
    contactEmail: string,
    returnUrls: {
      baseUrl: string,
      successPath: string,
      failurePath: string,
      pendingPath: string,
      cancelPath: string
    },
    dynamicDescriptor?: {
      merchantName: string,
      merchantUrl: string
    }
  }
}
```

#### Example Document

```json
{
  "_id": ObjectId("674abcdef1234567890"),
  "filename": "bestwin_december_2025.csv",
  "uploadedAt": ISODate("2025-11-18T14:30:00Z"),
  "uploadedBy": "admin@melinux.net",
  "records": [
    {
      "iban": "DE29731900000005021715",
      "amount": "89.00",
      "currency": "EUR",
      "first_name": "Klaus",
      "last_name": "Schmid",
      "email": "klaus@example.com",
      "vzweck1": "Monatsbeitrag 12-2025 BestWinCall KD: 76013213",
      "product_descriptor": "bestwin"
    }
  ],
  "totalRecords": 1,
  "status": "completed",
  "submittedCount": 1,
  "successCount": 1,
  "errorCount": 0,
  "rows": [
    {
      "index": 0,
      "baseTransactionId": "76013213-20251118-mi3sl6cp-00001",
      "status": "approved",
      "uniqueId": "2bbf27193e764c78fb8e482f8b2a3241",
      "retryCount": 0,
      "lastAttemptAt": ISODate("2025-11-18T14:32:00Z"),
      "attempts": [
        {
          "attemptNumber": 1,
          "timestamp": ISODate("2025-11-18T14:32:00Z"),
          "transactionId": "76013213-20251118-mi3sl6cp-00001",
          "status": "approved",
          "uniqueId": "2bbf27193e764c78fb8e482f8b2a3241"
        }
      ]
    }
  ],
  "totalAmount": 8900,
  "currency": "EUR",
  "companyConfig": {
    "name": "BestWin",
    "contactEmail": "Info@bestwin.team",
    "returnUrls": {
      "baseUrl": "https://bestwin.team",
      "successPath": "/success",
      "failurePath": "/failure",
      "pendingPath": "/pending",
      "cancelPath": "/cancel"
    },
    "dynamicDescriptor": {
      "merchantName": "bestwin",
      "merchantUrl": "https://bestwin.team"
    }
  }
}
```

#### Operations

**Create Upload**:
```typescript
const collection = db.collection('emp_uploads')
await collection.insertOne({
  filename: 'bestwin_import.csv',
  uploadedAt: new Date(),
  uploadedBy: 'admin@melinux.net',
  records: parsedCsvData,
  totalRecords: parsedCsvData.length,
  status: 'pending',
  submittedCount: 0,
  successCount: 0,
  errorCount: 0,
  rows: [],
  totalAmount: 0,
  currency: 'EUR'
})
```

**Update Row Status**:
```typescript
await collection.updateOne(
  { _id: uploadId, 'rows.index': rowIndex },
  {
    $set: {
      'rows.$.status': 'approved',
      'rows.$.uniqueId': uniqueId,
      'rows.$.lastAttemptAt': new Date()
    },
    $inc: { successCount: 1 }
  }
)
```

**Filter Chargebacks**:
```typescript
await collection.updateOne(
  { _id: uploadId },
  {
    $set: {
      records: cleanRecords,
      rows: cleanRows,
      totalRecords: cleanRecords.length,
      chargebackFilterStats: {
        appliedAt: new Date(),
        originalRowCount: originalCount,
        chargebackedRowCount: chargebackCount,
        cleanRowCount: cleanRecords.length,
        chargebackedIbans: Array.from(chargebackIbans)
      }
    }
  }
)
```

---

### `emp_reconcile_transactions`

Stores transaction data fetched from emerchantpay via notifications and reconciliation.

#### Schema

```typescript
{
  _id: ObjectId,
  uniqueId: string,                    // emerchantpay unique_id (indexed, unique)
  transactionId: string,               // Our transaction ID (indexed)
  
  // Transaction Details
  transactionType: string,             // e.g., "sdd_sale", "void", "chargeback"
  status: string,                      // e.g., "approved", "declined", "error"
  amount: number,                      // Amount in cents
  currency: string,                    // Currency code
  
  // Customer Details
  customerEmail?: string,
  bankAccountNumber?: string,          // IBAN for SEPA transactions
  cardNumber?: string,                 // Card number (if card transaction)
  
  // Timestamps
  timestamp: string,                   // emerchantpay timestamp
  receivedAt: Date,                    // When we received the notification
  
  // Relationships
  referenceId?: string,                // For linked transactions (void → original)
  originalTransactionUniqueId?: string, // For chargebacks
  
  // Full Response
  rawData: object,                     // Complete emerchantpay response
  
  // Metadata
  mode: string,                        // "live" or "test"
  terminal: string,                    // Terminal identifier
  descriptor?: string                  // Merchant descriptor
}
```

#### Example Document

```json
{
  "_id": ObjectId("674abcdef1234567891"),
  "uniqueId": "2bbf27193e764c78fb8e482f8b2a3241",
  "transactionId": "76013213-20251118-mi3sl6cp-00001",
  "transactionType": "sdd_sale",
  "status": "approved",
  "amount": 8900,
  "currency": "EUR",
  "customerEmail": "klaus@example.com",
  "bankAccountNumber": "DE29731900000005021715",
  "timestamp": "2025-11-18T14:32:01Z",
  "receivedAt": ISODate("2025-11-18T14:32:05Z"),
  "mode": "live",
  "terminal": "MelinuxLtd-melinux-SDD-EUR",
  "descriptor": "bestwin",
  "rawData": {
    // Full emerchantpay notification payload
  }
}
```

#### Operations

**Store Notification**:
```typescript
const collection = db.collection('emp_reconcile_transactions')
await collection.updateOne(
  { uniqueId: notificationData.unique_id },
  {
    $set: {
      transactionId: notificationData.transaction_id,
      transactionType: notificationData.transaction_type,
      status: notificationData.status,
      amount: notificationData.amount,
      currency: notificationData.currency,
      bankAccountNumber: notificationData.bank_account_number,
      timestamp: notificationData.timestamp,
      receivedAt: new Date(),
      rawData: notificationData
    }
  },
  { upsert: true }
)
```

**Find by Transaction ID**:
```typescript
const transaction = await collection.findOne({
  transactionId: '76013213-20251118-mi3sl6cp-00001'
})
```

---

### `emp_chargeback_cache`

Caches chargeback data for quick lookup and filtering.

#### Schema

```typescript
{
  _id: ObjectId,
  uniqueId: string,                    // Chargeback unique_id (indexed)
  originalTransactionUniqueId: string, // Original transaction unique_id (indexed)
  
  // Chargeback Details
  amount: number,                      // Chargeback amount (in cents)
  currency: string,
  reason?: string,                     // Chargeback reason code
  
  // Account Info
  iban?: string,                       // Normalized IBAN (uppercase, no spaces)
  bankAccountNumber?: string,
  cardNumber?: string,
  
  // Timestamps
  chargebackDate: Date,
  cachedAt: Date,
  
  // Metadata
  batchId?: string,                    // Associated batch (for analytics)
  resolved: boolean                    // Whether chargeback has been handled
}
```

#### Example Document

```json
{
  "_id": ObjectId("674abcdef1234567892"),
  "uniqueId": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "originalTransactionUniqueId": "2bbf27193e764c78fb8e482f8b2a3241",
  "amount": 8900,
  "currency": "EUR",
  "reason": "fraud",
  "iban": "DE29731900000005021715",
  "bankAccountNumber": "DE29731900000005021715",
  "chargebackDate": ISODate("2025-11-20T10:00:00Z"),
  "cachedAt": ISODate("2025-11-20T10:05:00Z"),
  "resolved": false
}
```

#### Operations

**Cache Chargeback**:
```typescript
const collection = db.collection('emp_chargeback_cache')
await collection.updateOne(
  { uniqueId: chargebackUniqueId },
  {
    $set: {
      originalTransactionUniqueId: originalTxUniqueId,
      amount: chargebackAmount,
      currency: 'EUR',
      iban: normalizedIban,
      bankAccountNumber: iban,
      chargebackDate: new Date(chargebackTimestamp),
      cachedAt: new Date(),
      resolved: false
    }
  },
  { upsert: true }
)
```

**Find Chargebacks by IBAN**:
```typescript
const chargebacks = await collection.find({
  iban: 'DE29731900000005021715',
  resolved: false
}).toArray()
```

---

### `emp_settings`

Stores application settings, including CSV field mappings.

#### Schema

```typescript
{
  _id: string,                         // Setting identifier (e.g., "field-mapping")
  
  // Field Mapping Settings
  mapping?: {
    iban: string[],                    // CSV columns for IBAN
    amount: string[],                  // CSV columns for amount
    currency: string[],                // CSV columns for currency
    firstName: string[],
    lastName: string[],
    email: string[],
    address: string[],
    zipCode: string[],
    city: string[],
    country: string[],
    shopperId: string[],
    usage: string[],
    productDescriptor: string[],       // For dynamic descriptors
    dueDate: string[]
  },
  
  updatedAt: Date,
  updatedBy: string
}
```

#### Example Document

```json
{
  "_id": "field-mapping",
  "mapping": {
    "iban": ["iban", "IBAN", "Iban"],
    "amount": ["amount", "betrag", "summe"],
    "currency": ["currency", "waehrung"],
    "firstName": ["first_name", "vorname"],
    "lastName": ["last_name", "nachname"],
    "email": ["email", "e-mail"],
    "address": ["address", "address1", "strasse"],
    "zipCode": ["zip_code", "plz", "postleitzahl"],
    "city": ["city", "stadt", "ort"],
    "country": ["country", "land"],
    "shopperId": ["shopper_id", "customer_id", "kunden_nr"],
    "usage": ["usage", "vzweck", "verwendungszweck"],
    "productDescriptor": ["product_descriptor", "vzweck1"],
    "dueDate": ["due_date", "faelligkeitsdatum"]
  },
  "updatedAt": ISODate("2025-11-01T12:00:00Z"),
  "updatedBy": "admin@melinux.net"
}
```

---

## Indexes

### `emp_uploads`

```typescript
db.emp_uploads.createIndex({ uploadedAt: -1 })
db.emp_uploads.createIndex({ status: 1 })
db.emp_uploads.createIndex({ 'rows.uniqueId': 1 })
db.emp_uploads.createIndex({ 'rows.baseTransactionId': 1 })
db.emp_uploads.createIndex({ batchId: 1 })
```

### `emp_reconcile_transactions`

```typescript
db.emp_reconcile_transactions.createIndex({ uniqueId: 1 }, { unique: true })
db.emp_reconcile_transactions.createIndex({ transactionId: 1 })
db.emp_reconcile_transactions.createIndex({ originalTransactionUniqueId: 1 })
db.emp_reconcile_transactions.createIndex({ bankAccountNumber: 1 })
db.emp_reconcile_transactions.createIndex({ transactionType: 1, status: 1 })
db.emp_reconcile_transactions.createIndex({ receivedAt: -1 })
```

### `emp_chargeback_cache`

```typescript
db.emp_chargeback_cache.createIndex({ uniqueId: 1 }, { unique: true })
db.emp_chargeback_cache.createIndex({ originalTransactionUniqueId: 1 })
db.emp_chargeback_cache.createIndex({ iban: 1 })
db.emp_chargeback_cache.createIndex({ resolved: 1, chargebackDate: -1 })
```

---

## Data Flow

### 1. CSV Upload Flow

```
User uploads CSV
↓
Parse CSV → Create emp_uploads document
↓
Generate transaction IDs for each row
↓
Submit to emerchantpay API
↓
Update row status in emp_uploads
↓
emerchantpay sends notification
↓
Store in emp_reconcile_transactions
↓
Update upload statistics
```

### 2. Chargeback Detection Flow

```
emerchantpay sends chargeback notification
↓
Store in emp_reconcile_transactions (type: chargeback)
↓
Extract originalTransactionUniqueId and IBAN
↓
Cache in emp_chargeback_cache
↓
Link to original transaction
↓
Update analytics
```

### 3. Chargeback Filtering Flow

```
User clicks "Filter Chargebacks" on upload
↓
Get all chargebacks from emp_chargeback_cache
↓
Extract IBANs from chargeback transactions
↓
Compare with upload CSV IBANs
↓
Remove matching rows from emp_uploads
↓
Update statistics and counts
```

### 4. Batch Synchronization Flow

```
User clicks "Sync Batch"
↓
Fetch all transactions from emerchantpay (by date range)
↓
Store/update in emp_reconcile_transactions
↓
Match transactions to uploads by transaction_id
↓
Update row statuses in emp_uploads
↓
Recalculate upload statistics
↓
Generate batch analytics
```

---

## Database Maintenance

### Backup Strategy

```bash
# Daily backup
mongodump --uri="$MONGODB_URI" --db=melinux_emp --out=/backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="$MONGODB_URI" --db=melinux_emp /backups/20251118/melinux_emp
```

### Cleanup Old Data

```typescript
// Remove uploads older than 90 days
await db.collection('emp_uploads').deleteMany({
  uploadedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
})

// Archive reconcile transactions older than 1 year
await db.collection('emp_reconcile_transactions_archive').insertMany(
  await db.collection('emp_reconcile_transactions').find({
    receivedAt: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
  }).toArray()
)
```

### Performance Optimization

```typescript
// Analyze slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)

// Check index usage
db.emp_uploads.aggregate([
  { $indexStats: {} }
])
```

---

## Connection Management

### Connection Pooling

The system uses a singleton MongoDB client with connection pooling:

**File**: `lib/db.ts`

```typescript
export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  // Reuse connection across serverless invocations
  if (!mongoState.promise) {
    mongoState.promise = connectNewClient(uri)
  }

  try {
    const client = await mongoState.promise
    // Validate connection
    await client.db(getDbName()).command({ ping: 1 })
    return client
  } catch {
    // Reconnect on failure
    mongoState.promise = connectNewClient(uri)
    return await mongoState.promise
  }
}
```

### Error Handling

```typescript
export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    console.error(`[MongoDB] Error during ${operationName}:`, error)
    
    if (error.code === 11000) {
      throw new Error('Duplicate entry detected')
    }
    if (error.message?.includes('timeout')) {
      throw new Error('Database operation timed out. Please try again.')
    }
    
    throw new Error(`Database error: ${error.message}`)
  }
}
```

---

**Last Updated**: November 2025  
**Version**: 2.0

