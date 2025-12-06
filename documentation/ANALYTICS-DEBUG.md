# Analytics Dashboard - Debugging & "Dump All" Feature

## What We've Done

### 🔍 Enhanced Debugging
1. **Better Logging**: Added detailed console logs showing:
   - Which endpoint is being tried (`by_date` vs `by_post_date`)
   - Number of transaction blocks found in XML
   - First parsed transaction details
   - Pagination info (page, total_count, pages_count)

2. **Try Multiple Endpoints**: The API now tries BOTH endpoints:
   - `/processed_transactions/by_date` (first)
   - `/processed_transactions/by_post_date` (fallback)
   
3. **Extended Date Range**: Changed default from 30 days to **2 years** for maximum data coverage

### 🚀 "Dump All" Feature
Added a **"Dump All"** button that:
- Fetches ALL pages of transactions (not just the first 500)
- Loops through all available pages using pagination
- Useful when you have more than 500 transactions

## How to Use

### Normal Refresh (First Page Only)
Click the **"Refresh"** button - fetches up to 500 transactions

### Dump All (All Pages)
Click the **"Dump All"** button - fetches ALL transactions across all pages

## Debugging Steps

### 1. Check the Terminal/Console Output
When you load the analytics page, look for these logs:

```
[Analytics] Trying endpoint: https://staging.gate.emerchantpay.net/processed_transactions/by_date
[Analytics] Date range: 2023-11-06 to 2025-11-06
[Analytics] Response from ...: <?xml version="1.0"...
[Analytics] by_date - Page 1/0, Total count: 0
[Analytics] Found 0 transaction blocks in XML
```

**Key things to check:**
- `total_count`: Should show number of transactions available
- `pages_count`: Should show how many pages exist
- Transaction blocks found: Should be > 0 if there's data

### 2. If Still No Data, Check:

#### A. Merchant Portal
1. Log into the merchant portal (URL set in NEXT_PUBLIC_EMP_MERCHANT_PORTAL_URL)
   - Production: https://emp.merchant.emerchantpay.net
   - Staging: https://emp.staging.merchant.emerchantpay.net
2. Go to "Payment Transactions"
3. **Do you see any transactions there?**
   - If YES → API credentials might be for different merchant
   - If NO → No data exists in the environment

#### B. Environment Variables
Check your `.env` file:
```bash
EMP_GENESIS_ENDPOINT=https://staging.gate.emerchantpay.net
EMP_GENESIS_USERNAME=your_username_here
EMP_GENESIS_PASSWORD=your_password_here
```

#### C. Test with Production (if you have access)
```bash
EMP_GENESIS_ENDPOINT=https://gate.emerchantpay.net
# Use production credentials
```

### 3. Manual Test with cURL
You can test directly with cURL to see if the API works:

```bash
curl https://staging.gate.emerchantpay.net/processed_transactions/by_date \
  -X POST \
  -u "USERNAME:PASSWORD" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<processed_transaction_request>
  <start_date>2020-01-01</start_date>
  <end_date>2025-12-31</end_date>
  <per_page>100</per_page>
  <page>1</page>
  <externally_processed>all</externally_processed>
  <processing_type>all</processing_type>
</processed_transaction_request>'
```

Replace `USERNAME:PASSWORD` with your credentials.

## Common Issues

### Issue: "total_count: 0"
**Cause**: No transactions exist in the system for the date range
**Solutions**:
- Extend date range even further (we're already at 2 years)
- Check if you're on staging vs production
- Verify transactions exist in the merchant portal
- Try the `by_post_date` endpoint

### Issue: Authentication Successful but Empty Response
**Cause**: Credentials might be for a different merchant account
**Solutions**:
- Verify the merchant number in the portal matches your credentials
- Check with emerchantpay support about which merchant your credentials belong to

### Issue: XML Parsing Returns 0 Blocks
**Cause**: XML format might be different than expected
**Solutions**:
- Check the console logs for the actual XML response
- The response structure might be wrapped differently
- Look for `<processed_transaction_response>` tags in the XML

## Expected Console Output (With Data)

```
[Analytics] Trying endpoint: https://staging.gate.emerchantpay.net/processed_transactions/by_date
[Analytics] Date range: 2023-11-06 to 2025-11-06
[Analytics] Response from ...: <?xml version="1.0" encoding="UTF-8"?>
<processed_transaction_responses per_page="500" page="1" total_count="1234" pages_count="3">
  <processed_transaction_response>
    <merchant_number>124000000006698</merchant_number>
    ...
[Analytics] by_date - Page 1/3, Total count: 1234
[Analytics] Found 500 transaction blocks in XML
[Analytics] First transaction parsed: { uniqueId: '...', amount: 1000, ... }
[Analytics] Found 500 transactions from https://staging.gate.emerchantpay.net/processed_transactions/by_date
[Analytics] Total fetched: 500 transactions
```

## Next Steps

1. **Check Terminal Output** - Look at the logs when you refresh the analytics page
2. **Share the XML Response** - If you see `total_count="0"`, check the portal
3. **Try Different Date Ranges** - Maybe transactions are older/newer
4. **Contact emerchantpay** - If credentials are correct but no data appears

## Questions to Answer

1. ✅ Are you using **staging** or **production**?
2. ✅ Do transactions appear in the **merchant portal**?
3. ✅ What does the **console log** show for `total_count`?
4. ❓ What merchant number is shown in the portal?
5. ❓ Does the merchant number match your credentials?

