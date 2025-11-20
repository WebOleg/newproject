# emerchantpay Genesis API Integration

This document explains how our system integrates with the emerchantpay Genesis API for SEPA Direct Debit (SDD) transactions, including transaction submission, dynamic descriptors, and void operations.

## Table of Contents

- [Overview](#overview)
- [SDD Sale Transactions](#sdd-sale-transactions)
- [Dynamic Descriptors](#dynamic-descriptors)
- [Void Transactions](#void-transactions)
- [Reconciliation](#reconciliation)
- [Error Handling](#error-handling)

---

## Overview

The emerchantpay Genesis API is a payment gateway that supports multiple transaction types. Our integration focuses on:

1. **SDD Sale** - Direct debit sales (primary transaction type)
2. **Void** - Cancel pending/approved transactions
3. **Reconcile** - Fetch transaction details for verification

### Authentication

All API requests use HTTP Basic Authentication:

```typescript
Authorization: Basic base64(username:password)
```

Credentials are stored in environment variables:
- `EMP_GENESIS_USERNAME`
- `EMP_GENESIS_PASSWORD`
- `EMP_GENESIS_TERMINAL_TOKEN`

### API Endpoint

```
POST https://gate.emerchantpay.net/process/{terminal_token}
Content-Type: text/xml
```

---

## SDD Sale Transactions

### Transaction Flow

```
1. CSV Upload → Parse Records
2. Map Fields → Build Transaction Request
3. Generate Unique Transaction ID
4. Build XML Request with Dynamic Descriptors
5. Submit to emerchantpay API
6. Parse XML Response
7. Store Result in MongoDB
8. Handle Redirect URL (if provided)
```

### Building a Transaction

**File**: `lib/emerchantpay.ts` → `buildSddSaleXml()`

```typescript
export type SddSaleRequest = {
  transactionId: string          // Unique ID (auto-generated)
  amountMinor: number             // Amount in cents (e.g., 8900 for €89)
  currency: string                // ISO 4217 code (e.g., EUR)
  usage?: string                  // Transaction description
  firstName?: string
  lastName?: string
  address1?: string
  zipCode?: string
  city?: string
  country?: string                // ISO 3166-1 alpha-2 (e.g., DE)
  customerEmail?: string
  iban: string                    // Customer's IBAN
  remoteIp?: string               // Customer IP (optional)
  dynamicDescriptorParams?: {     // See Dynamic Descriptors section
    merchantName?: string
    merchantUrl?: string
    // ... more fields
  }
  customReturnUrls?: {            // Override default return URLs
    baseUrl?: string              // e.g., "https://bestwin.team"
    successPath?: string          // default: "/success"
    failurePath?: string          // default: "/failure"
    pendingPath?: string          // default: "/pending"
    cancelPath?: string           // default: "/cancel"
  }
}
```

### XML Request Structure

```xml
<payment_transaction>
  <transaction_type>sdd_sale</transaction_type>
  <transaction_id>76013323-20251118-mi3sl6cp-00099</transaction_id>
  <notification_url>https://yourdomain.com/api/emp/notifications</notification_url>
  <return_success_url>https://bestwin.team/success</return_success_url>
  <return_failure_url>https://bestwin.team/failure</return_failure_url>
  <return_pending_url>https://bestwin.team/pending</return_pending_url>
  <return_cancel_url>https://bestwin.team/cancel</return_cancel_url>
  <usage>Membership Fee December 2025</usage>
  <remote_ip>31.13.207.176</remote_ip>
  <amount>8900</amount>
  <currency>EUR</currency>
  <billing_address>
    <first_name>Klaus</first_name>
    <last_name>Schmid</last_name>
    <address1>Hauptstrasse 123</address1>
    <zip_code>80331</zip_code>
    <city>Munich</city>
    <country>DE</country>
  </billing_address>
  <customer_email>klaus@example.com</customer_email>
  <iban>DE29731900000005021715</iban>
  <dynamic_descriptor_params>
    <merchant_name>Grand Luck Service</merchant_name>
    <merchant_url>https://www.grand-luck-service.com</merchant_url>
  </dynamic_descriptor_params>
</payment_transaction>
```

### Response Handling

**Successful Response**:

```xml
<payment_response>
  <transaction_type>sdd_sale</transaction_type>
  <status>approved</status>
  <mode>live</mode>
  <transaction_id>76013323-20251118-mi3sl6cp-00099</transaction_id>
  <unique_id>2bbf27193e764c78fb8e482f8b2a3241</unique_id>
  <timestamp>2025-11-18T14:51:01Z</timestamp>
  <descriptor>melinux</descriptor>
  <amount>8900</amount>
  <currency>EUR</currency>
  <redirect_url>https://gate.emerchantpay.net/redirect/...</redirect_url>
</payment_response>
```

**Error Response**:

```xml
<payment_response>
  <transaction_type>sdd_sale</transaction_type>
  <status>error</status>
  <code>340</code>
  <technical_message>Transaction with this transaction_id already exists!</technical_message>
  <message>Duplicate transaction</message>
</payment_response>
```

### Transaction ID Generation

**File**: `lib/emp.ts` → `buildTransactionId()`

Transaction IDs are generated with the following components to ensure uniqueness:

```typescript
// Example: 76013323-20251118-mi3sl6cp-00099
// Components:
// - 76013323: Shopper ID (sanitized)
// - 20251118: Current date (YYYYMMDD)
// - mi3sl6cp: Base-36 timestamp
// - 00099: Row index (4 digits)
```

This prevents duplicate transaction IDs even when:
- Uploading the same CSV multiple times
- Processing the same customer on the same day
- Retrying failed transactions

---

## Dynamic Descriptors

Dynamic descriptors allow you to customize how transactions appear on customer bank statements.

### What are Dynamic Descriptors?

When a customer checks their bank statement, they'll see:
- **Merchant Name** (max 25 chars) - e.g., "Grand Luck Service"
- **Merchant URL** (max 60 chars) - e.g., "https://www.grand-luck-service.com"

### Available Descriptor Fields

```typescript
export type DynamicDescriptorParams = {
  merchantName?: string              // max 25 chars - Appears on bank statement
  merchantCity?: string              // max 13 chars
  subMerchantId?: string             // max 15 chars
  merchantCountry?: string           // max 3 chars
  merchantState?: string             // max 3 chars
  merchantZipCode?: string           // max 10 chars
  merchantAddress?: string           // max 48 chars
  merchantUrl?: string               // max 60 chars
  merchantPhone?: string             // max 16 chars
  merchantServiceCity?: string       // max 13 chars
  merchantServiceCountry?: string    // max 3 chars
  merchantServiceState?: string      // max 3 chars
  merchantServiceZipCode?: string    // max 10 chars
  merchantServicePhone?: string      // max 16 chars
  merchantGeoCoordinates?: string    // max 20 chars
  merchantServiceGeoCoordinates?: string // max 20 chars
}
```

### How Descriptors are Applied

**File**: `lib/emp.ts` → `mapRecordToSddSale()`

The system applies descriptors in the following priority order:

1. **CSV Data** - `product_descriptor` or `vzweck1` field
2. **Company Config** - Detected from filename
3. **Default** - Environment variable settings

```typescript
// Example: BestWin file
const companyConfig = {
  name: 'BestWin',
  dynamicDescriptor: {
    merchantName: 'bestwin',
    merchantUrl: 'https://bestwin.team',
  }
}

// If CSV has product_descriptor = "Grand Luck Service"
// Result: merchantName = "Grand Luck Service" (CSV takes priority)
//         merchantUrl = "https://bestwin.team" (from company config)
```

### Company-Specific Configurations

**BestWin** (filename contains "bestwin"):
```typescript
{
  merchantName: 'bestwin',
  merchantUrl: 'https://bestwin.team'
}
```

**Grand Luck** (filename contains "grandluck", "grand-luck", or "grand_luck"):
```typescript
{
  merchantName: 'Grand Luck Service',
  merchantUrl: 'https://www.grand-luck-service.com'
}
```

**MeLinux** (default):
```typescript
{
  merchantName: 'melinux',
  merchantUrl: 'https://www.melinux.net'
}
```

### CSV Field Mapping

The system looks for these CSV columns to populate descriptors:

- `product_descriptor` → `merchantName`
- `vzweck1` → `merchantName` (if product_descriptor not present)

Example CSV:
```csv
iban,amount,product_descriptor
DE29731900000005021715,89.00,Grand Luck Service
```

Result:
```xml
<dynamic_descriptor_params>
  <merchant_name>Grand Luck Service</merchant_name>
  <merchant_url>https://www.grand-luck-service.com</merchant_url>
</dynamic_descriptor_params>
```

---

## Void Transactions

Void transactions cancel a pending or approved transaction before it's finalized.

### When to Use Void

✅ **Can Void**:
- Transactions with status "approved" or "pending_async"
- Same-day transactions (before settlement)
- Transactions that haven't been captured yet

❌ **Cannot Void**:
- Settled transactions (use refund instead)
- Already voided transactions
- Error transactions

### Void Request

**File**: `lib/emerchantpay-void.ts` → `voidTransaction()`

```typescript
export type VoidTransactionRequest = {
  transactionId: string    // Your new transaction ID for the void
  referenceId: string      // unique_id from the original transaction
  usage?: string           // Reason for void (e.g., "Manual void")
  remoteIp?: string        // IP address
}
```

### XML Request

```xml
<payment_transaction>
  <transaction_type>void</transaction_type>
  <transaction_id>manual-void-1763485391540</transaction_id>
  <usage>Manual void</usage>
  <remote_ip>31.13.207.176</remote_ip>
  <reference_id>2bbf27193e764c78fb8e482f8b2a3241</reference_id>
</payment_transaction>
```

### Void Response

**Success**:
```xml
<payment_response>
  <transaction_type>void</transaction_type>
  <status>approved</status>
  <transaction_id>manual-void-1763485391540</transaction_id>
  <unique_id>44177a21403427eb96664a6d7e5d5d48</unique_id>
  <reference_id>2bbf27193e764c78fb8e482f8b2a3241</reference_id>
  <amount>8900</amount>
  <currency>EUR</currency>
</payment_response>
```

**Error**:
```xml
<payment_response>
  <transaction_type>void</transaction_type>
  <status>error</status>
  <code>410</code>
  <technical_message>Transaction not found or not voidable</technical_message>
</payment_response>
```

### Common Void Errors

| Error | Reason | Solution |
|-------|--------|----------|
| `Unknown system error!` | Transaction is "Pending async" | Wait for transaction to become "Approved" |
| `Transaction not found` | Invalid reference_id | Verify the unique_id from original transaction |
| `Transaction already voided` | Already canceled | No action needed |
| `Settlement cutoff passed` | Transaction already settled | Use refund transaction instead |

### Void in Dashboard

Users can void transactions in three ways:

1. **Void Approved Button** - Bulk void all approved transactions in an upload
2. **Manual Void Dialog** - Void a single transaction by unique_id
3. **Row Actions** - Void individual rows from the table

---

## Reconciliation

Reconciliation retrieves transaction details from emerchantpay for verification and syncing.

### Reconcile Request

**File**: `lib/emerchantpay-reconcile.ts` → `reconcileTransaction()`

```typescript
// By unique_id
reconcileTransaction('2bbf27193e764c78fb8e482f8b2a3241')

// By transaction_id
reconcileTransaction({ transactionId: '76013323-20251118-mi3sl6cp-00099' })
```

### Reconciliation Flow

```
1. Fetch notification data from emerchantpay
2. Parse transaction details (status, amount, etc.)
3. Store in MongoDB (emp_reconcile_transactions)
4. Link to original upload via transaction_id
5. Update upload statistics
```

### Transaction Statuses

| Status | Description | Next Action |
|--------|-------------|-------------|
| `approved` | Transaction approved, pending settlement | Wait for settlement |
| `pending_async` | Being processed by bank | Wait for approval |
| `declined` | Rejected by bank | Review and retry |
| `error` | System error | Check logs, contact support |
| `voided` | Canceled by void transaction | No action needed |
| `chargebacked` | Customer disputed transaction | Handle chargeback |

---

## Error Handling

### Common API Errors

**Duplicate Transaction ID (340)**:
```json
{
  "code": "340",
  "message": "Transaction with this transaction_id already exists!"
}
```
**Solution**: Use the "Reset" button to clear transaction IDs and generate new ones.

**Invalid IBAN**:
```json
{
  "code": "310",
  "message": "Invalid IBAN format"
}
```
**Solution**: Validate IBAN in CSV before upload.

**Insufficient Permissions**:
```json
{
  "code": "100",
  "message": "Terminal token is invalid or inactive"
}
```
**Solution**: Verify `EMP_GENESIS_TERMINAL_TOKEN` in environment variables.

### Retry Logic

Failed transactions can be retried with these strategies:

1. **Automatic Retry** - System retries 3 times with exponential backoff
2. **Manual Retry** - User clicks retry button for specific row
3. **Batch Retry** - Retry all failed transactions in an upload
4. **Reset & Resubmit** - Clear all IDs and resubmit as new transactions

### Logging

All API requests are logged with:
- Transaction ID
- Amount and currency
- Masked IBAN (first 4 + last 4 chars)
- Response status
- Error messages (if any)

**Enable XML Logging** (for debugging):

Uncomment in `lib/emerchantpay.ts`:
```typescript
console.info('[EMP] Raw XML Request:\n', xml)
console.info('[EMP] Raw XML Response:\n', text)
```

---

## Best Practices

### Transaction IDs
- Always include timestamp component
- Add random component for uniqueness
- Keep under 50 characters
- Use only alphanumeric and hyphens

### Dynamic Descriptors
- Keep merchant_name under 20 chars for best display
- Include website URL for customer verification
- Use consistent naming across transactions
- Test how it appears on bank statements

### Error Handling
- Always check response status
- Store error details for debugging
- Implement retry logic with backoff
- Monitor duplicate transaction errors

### Security
- Never log full IBANs or customer emails
- Use HTTPS for all API calls
- Rotate API credentials regularly
- Validate all CSV input before processing

---

## API Reference

### emerchantpay Documentation
- **Official Docs**: https://emerchantpay.com/docs
- **API Reference**: https://emerchantpay.com/docs/genesis-api
- **Support**: tech-support@emerchantpay.com

### Our Implementation Files
- `lib/emerchantpay.ts` - SDD Sale transactions
- `lib/emerchantpay-void.ts` - Void operations
- `lib/emerchantpay-reconcile.ts` - Reconciliation
- `lib/emp.ts` - CSV parsing and company detection
- `app/api/emp/submit/[id]/route.ts` - Single submission endpoint
- `app/api/emp/submit-batch/[id]/route.ts` - Batch submission endpoint

---

**Last Updated**: November 2025  
**Version**: 2.0

