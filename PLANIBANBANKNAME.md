# Implementation Plan: Bank Name Lookup from IBAN

## Overview
Add functionality to extract bank names from IBAN numbers throughout the system, enabling users to see which bank each transaction/chargeback belongs to, and group chargebacks by bank.

## Current State Analysis

### Where IBANs are Used
1. **Transaction Records** (`emp_reconcile_transactions` collection)
   - Field: `bankAccountNumber` stores the IBAN
   - Used for SEPA Direct Debit transactions

2. **Upload Records** (`uploads` collection)
   - CSV files contain IBAN field
   - Stored in `records` array

3. **Analytics & Reporting**
   - Batch chargeback analysis
   - Chargeback extraction
   - Transaction listings
   - PDF exports

### Current Display Locations
- Analytics dashboard transaction tables
- Batch chargeback analysis page
- Chargeback extraction reports
- Upload detail views
- PDF exports

## Technical Approach Options

### Option A: Local Library + BIC Mapping (RECOMMENDED)
**Pros:**
- No external API dependencies
- Fast lookups (in-memory)
- No rate limits or costs
- Works offline
- Full control over data

**Cons:**
- Need to maintain BIC-to-bank-name mapping
- May not have all banks in database
- Requires periodic updates

**Implementation:**
1. Install `iban-to-bic` package to extract BIC/SWIFT codes from IBANs
2. Create a BIC-to-bank-name mapping database
3. Implement lookup functions
4. Cache results for performance

### Option B: External API (OpenIBAN, IBANCalculator)
**Pros:**
- Always up-to-date bank information
- No local database maintenance
- Comprehensive coverage

**Cons:**
- Requires internet connectivity
- API rate limits
- Potential costs
- Latency for each lookup
- Third-party dependency

### Option C: Hybrid Approach
**Pros:**
- Best of both worlds
- Fallback mechanism

**Cons:**
- More complex implementation
- Higher maintenance

## Recommended Implementation: Option A

### Phase 1: Core Library Setup

#### 1.1 Install Dependencies
```bash
pnpm add iban-to-bic
pnpm add ibankit  # For IBAN validation and utilities
```

#### 1.2 Create Bank Lookup Utility (`lib/bank-lookup.ts`)
- Function to extract BIC from IBAN
- Function to get bank name from BIC
- Caching mechanism for performance
- Fallback for unknown banks

#### 1.3 Create BIC Database (`lib/data/bic-to-bank.json`)
- Start with major European banks
- Include common German, French, Italian, Spanish banks
- Structure: `{ "BIC_CODE": "Bank Full Name" }`

### Phase 2: Database Schema Updates

#### 2.1 Add Bank Fields to Collections
Update `emp_reconcile_transactions`:
```typescript
{
  bankAccountNumber: string,  // existing
  bankBIC?: string,            // new - extracted BIC
  bankName?: string,           // new - resolved bank name
  // ... other fields
}
```

Update `uploads.rows`:
```typescript
{
  // ... existing fields
  bankBIC?: string,
  bankName?: string,
}
```

#### 2.2 Create Migration Script (`scripts/enrich-bank-names.ts`)
- Iterate through existing transactions
- Extract BIC from IBAN
- Lookup and populate bank names
- Update records in batches

### Phase 3: API Integration

#### 3.1 Update Transaction Sync (`lib/services/analytics-sync.ts`)
- When syncing transactions, automatically extract and store bank info
- Add bank lookup to transaction processing pipeline

#### 3.2 Update Upload Processing (`lib/emp.ts`)
- When processing CSV uploads, extract bank info from IBANs
- Store in row data for quick access

#### 3.3 Create Bank Lookup API Endpoint (`app/api/emp/bank-lookup/route.ts`)
```typescript
POST /api/emp/bank-lookup
Body: { iban: "DE89370400440532013000" }
Response: {
  bic: "COBADEFFXXX",
  bankName: "Commerzbank",
  country: "DE"
}
```

### Phase 4: Analytics Enhancements

#### 4.1 Update Stats API (`app/api/emp/analytics/stats/route.ts`)
Add new aggregations:
- `chargebacksByBank` - Group chargebacks by bank name
- `transactionsByBank` - Group transactions by bank

#### 4.2 Update Batch Chargebacks API (`app/api/emp/analytics/batch-chargebacks/route.ts`)
Add bank information to chargeback records

#### 4.3 Create Bank-Specific Chargeback View
New endpoint: `/api/emp/analytics/chargebacks-by-bank`
- Groups all chargebacks by bank
- Shows totals per bank
- Calculates chargeback rate per bank

### Phase 5: UI Updates

#### 5.1 Analytics Dashboard (`app/emp/analytics/page.tsx`)
Add new chart:
- **Chargebacks by Bank** - Bar chart showing top banks by chargeback count
- Filter transactions by bank
- Display bank name in transaction tables

#### 5.2 Batch Chargebacks Page (`app/emp/analytics/batch-chargebacks/page.tsx`)
- Add "Bank" column to chargeback details
- Add filter/search by bank name
- Group chargebacks by bank option

#### 5.3 Chargeback Extraction Page
- Include bank name in CSV export
- Add bank column to display

#### 5.4 Upload Detail Page
- Show bank name next to IBAN
- Display bank distribution in batch

### Phase 6: PDF Export Updates

#### 6.1 Update PDF Export (`lib/pdf-export.ts`)
- Add bank names to transaction listings
- Add "Chargebacks by Bank" section
- Include bank in chargeback details

## Data Structure

### BIC-to-Bank Database Schema
```json
{
  "COBADEFFXXX": "Commerzbank",
  "DEUTDEFFXXX": "Deutsche Bank",
  "BYLADEM1001": "Postbank",
  "GENODEF1P15": "Volksbank",
  "SOGEDEFFXXX": "Société Générale",
  "BNPAFRPPXXX": "BNP Paribas",
  // ... more entries
}
```

### Extended Transaction Record
```typescript
{
  uniqueId: "abc123",
  transactionId: "tx-001",
  bankAccountNumber: "DE89370400440532013000",
  bankBIC: "COBADEFFXXX",
  bankName: "Commerzbank",
  bankCountry: "DE",
  amount: 8900,
  // ... other fields
}
```

## Implementation Steps Priority

### Must Have (MVP)
1. ✅ Install `iban-to-bic` and `ibankit` packages
2. ✅ Create `lib/bank-lookup.ts` utility
3. ✅ Create initial BIC database with top 50 European banks
4. ✅ Add bank fields to database schema
5. ✅ Update transaction sync to populate bank info
6. ✅ Display bank names in analytics dashboard
7. ✅ Add "Chargebacks by Bank" chart

### Should Have
8. Update batch chargebacks page with bank info
9. Add bank filter to transaction views
10. Include bank in PDF exports
11. Create migration script for existing data

### Nice to Have
12. Bank logo/icon display
13. Bank-specific chargeback statistics page
14. Automatic bank database updates
15. Admin UI to manage BIC mappings

## Testing Strategy

### Unit Tests
- Test IBAN to BIC extraction
- Test BIC to bank name lookup
- Test fallback for unknown banks
- Test caching mechanism

### Integration Tests
- Test transaction sync with bank enrichment
- Test API endpoints
- Test database updates

### Manual Testing
- Upload CSV with various IBANs
- Verify bank names appear correctly
- Test filtering and grouping by bank
- Verify PDF exports include bank info

## Performance Considerations

1. **Caching**: Cache BIC lookups in memory (Map/LRU)
2. **Batch Processing**: Process bank lookups in batches for migrations
3. **Lazy Loading**: Only lookup bank names when needed for display
4. **Database Indexes**: Add index on `bankBIC` and `bankName` fields

## Potential Issues & Solutions

### Issue 1: Unknown Banks
**Solution**: Display "Unknown Bank" or the BIC code itself, with option to manually add

### Issue 2: Invalid IBANs
**Solution**: Validate IBAN before lookup, handle errors gracefully

### Issue 3: Database Size
**Solution**: Start with top banks, expand based on actual usage

### Issue 4: BIC Extraction Failure
**Solution**: Some IBANs might not have a valid BIC mapping, show IBAN country code as fallback

## Questions for User

Before implementing, I need to clarify:

1. **Scope**: Which countries' banks are most important? (Germany, France, Italy, Spain, etc.)
2. **Display Priority**: Where is seeing bank names most important first?
   - Analytics dashboard?
   - Batch chargeback analysis?
   - Transaction lists?
3. **Grouping**: Do you want to filter/exclude certain banks from future transactions?
4. **Fallback**: What should we display if bank cannot be determined?
   - Just show "Unknown Bank"?
   - Show IBAN country code?
   - Show BIC if available?

## Estimated Timeline

- **Phase 1** (Core Library): 2-3 hours
- **Phase 2** (Database): 1-2 hours
- **Phase 3** (API Integration): 3-4 hours
- **Phase 4** (Analytics): 2-3 hours
- **Phase 5** (UI Updates): 4-5 hours
- **Phase 6** (PDF Export): 1-2 hours

**Total**: 13-19 hours of development

## Next Steps

1. Get user approval on approach
2. Answer clarifying questions above
3. Begin Phase 1 implementation
4. Test with real IBAN data
5. Iterate based on feedback
