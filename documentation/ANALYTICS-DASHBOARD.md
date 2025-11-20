# Analytics Dashboard

## Overview

A comprehensive analytics dashboard for the EMP Portal that fetches real-time transaction and chargeback data directly from emerchantpay's Reporting APIs.

## Features

### 1. Transaction Analytics
- **Data Source**: Emerchantpay Processed Transactions API
- **Endpoint**: `/api/emp/analytics/transactions`
- **Features**:
  - Fetch transactions by date range (default: last 30 days)
  - View transaction counts, volumes, and status distribution
  - Interactive charts showing:
    - Transactions by Type (Pie Chart)
    - Transactions by Status (Bar Chart)
    - Transactions by Card Scheme (Pie Chart)
    - Transaction Timeline (Line Chart)

### 2. Chargeback Analysis
- **Data Source**: Emerchantpay Chargebacks API
- **Endpoint**: `/api/emp/analytics/chargebacks`
- **Features**:
  - Fetch chargebacks by date range (default: last 90 days)
  - Comprehensive reason code mapping with human-readable explanations
  - Chargeback overview with:
    - Total chargebacks count
    - Chargeback rate percentage
    - Chargebacks by reason code (Bar Chart)
    - Detailed chargeback table with ARN, type, amount, and reason description

### 3. Key Metrics Dashboard
Four key performance indicators:
- **Total Transactions**: Count of all processed transactions
- **Total Volume**: Sum of all transaction amounts (formatted by currency)
- **Total Chargebacks**: Count of disputed transactions
- **Chargeback Rate**: Percentage of transactions that resulted in chargebacks

### 4. Chargeback Reason Code Mapping
Comprehensive mapping of chargeback reason codes to human-readable explanations:

#### Visa Reason Codes
- 10.1-10.5: Fraud-related chargebacks
- 11.x: Authorization issues
- 12.x: Processing errors
- 13.x: Consumer disputes

#### Mastercard Reason Codes
- 4807-4871: Various chargeback categories including fraud, authorization, and processing errors

#### American Express Reason Codes
- F10-F31: Card and authorization issues
- C02-C32: Consumer disputes
- P01-P23: Processing errors

## Implementation Details

### API Routes

#### `/api/emp/analytics/transactions/route.ts`
- Fetches processed transactions from emerchantpay
- Uses XML request/response format
- Supports date range filtering
- Returns parsed transaction data with:
  - Transaction ID, type, date
  - Amount, currency
  - Card scheme, card number (masked)
  - Status, authorization code
  - ARN (Acquirer Reference Number)

#### `/api/emp/analytics/chargebacks/route.ts`
- Fetches chargebacks from emerchantpay
- Uses XML request/response format
- Supports date range filtering
- Maps reason codes to descriptions
- Returns parsed chargeback data with full details

### Frontend Components

#### `/app/emp/analytics/page.tsx`
A comprehensive dashboard page featuring:
- Date range filter
- Real-time data fetching
- Interactive charts using Recharts
- Responsive design with shadcn/ui components
- Loading states and error handling
- Color-coded visualizations

### Navigation

The Analytics dashboard is accessible from the EMP Portal header with a dedicated "Analytics" button (BarChart3 icon).

## Usage

1. **Access**: Navigate to `/emp/analytics` (requires authentication)
2. **Date Range**: Use the date filter to select your desired time period
3. **Refresh**: Click the refresh button to fetch latest data from emerchantpay
4. **Charts**: Interact with charts to see detailed breakdowns
5. **Chargebacks**: Scroll down to view chargeback details and reason codes

## Environment Variables

The analytics dashboard uses the same emerchantpay credentials as the rest of the EMP portal:

```
EMP_GENESIS_USERNAME=your_username
EMP_GENESIS_PASSWORD=your_password
EMP_GENESIS_ENDPOINT=https://staging.gate.emerchantpay.net
```

## Data Flow

1. User visits `/emp/analytics`
2. Frontend calls API routes with date range parameters
3. API routes construct XML requests
4. Requests sent to emerchantpay Reporting APIs with Basic Auth
5. XML responses parsed and transformed to JSON
6. Data returned to frontend
7. Charts and tables rendered with processed data

## Technical Stack

- **Backend**: Next.js App Router API routes
- **Authentication**: Basic Auth with emerchantpay credentials
- **Data Format**: XML (emerchantpay) ↔ JSON (frontend)
- **Charts**: Recharts library
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Icons**: Lucide React

## Benefits

1. **Real-time Data**: Fetches live data directly from emerchantpay APIs
2. **No Database Dependency**: Bypasses MongoDB, uses emerchantpay as source of truth
3. **Comprehensive Insights**: View transaction patterns and chargeback reasons
4. **User-Friendly**: Human-readable chargeback reason descriptions
5. **Responsive Design**: Works on desktop and mobile devices
6. **Extensible**: Easy to add more metrics and charts

## Future Enhancements

Potential improvements:
- Export data to CSV/Excel
- Email reports
- Alerts for high chargeback rates
- Comparison with previous periods
- Advanced filtering (by card type, amount range, etc.)
- Real-time notifications for new chargebacks
- Predictive analytics for fraud detection

## References

- [Emerchantpay Processed Transactions API](https://docs.emerchantpay.com/payments/reporting/processed-transactions/)
- [Emerchantpay Chargebacks API](https://docs.emerchantpay.com/payments/reporting/chargebacks-api1x/)

