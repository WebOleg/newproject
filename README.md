# MeLinux EmerchantPay Integration Platform

A Next.js application for managing SEPA Direct Debit (SDD) transactions through the emerchantpay Genesis API, with multi-company support, chargeback management, and batch processing capabilities.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB instance
- emerchantpay Genesis API credentials

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables (see Configuration below)
cp .env.example .env.local

# Run development server
pnpm dev
```

Visit `http://localhost:3000` to access the application.

## 📋 Features

### Core Functionality
- **CSV Upload & Processing**: Upload customer CSV files for batch SEPA Direct Debit processing
- **Multi-Company Support**: Automatic detection and configuration for BestWin, Grand Luck, and MeLinux
- **Dynamic Descriptors**: Customize merchant information on bank statements
- **Chargeback Management**: Automatic detection, filtering, and void functionality
- **Transaction Reconciliation**: Sync and match transactions with emerchantpay
- **Batch Analytics**: View transaction statistics, success rates, and financial summaries

### Advanced Features
- **Retry Logic**: Automatic and manual retry for failed transactions
- **Row Editing**: Edit individual CSV rows before submission
- **Manual Void**: Cancel pending/approved transactions
- **Chargeback Extraction**: Export CSVs with chargebacks or clean transactions only
- **Real-time Status Updates**: Live transaction status tracking
- **Duplicate Prevention**: Smart transaction ID generation with timestamps and random components

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Payment Processing**: emerchantpay Genesis API
- **Authentication**: JWT-based session management

### Project Structure
```
/app
  /api/emp          # emerchantpay API routes
  /emp              # Employee/admin dashboard
  /services         # Public service pages
/components
  /emp              # Dashboard components
  /ui               # Reusable UI components
/lib
  emerchantpay.ts   # SDD Sale transactions
  emerchantpay-void.ts   # Void transactions
  emerchantpay-reconcile.ts   # Reconciliation
  emp.ts            # CSV parsing & company detection
  db.ts             # MongoDB utilities
/documentation      # Technical documentation
/.tools             # Helper scripts (CSV diff, etc.)
```

## 📚 Documentation

Detailed technical documentation is available in the `/documentation` folder:

- **[emerchantpay API Integration](./documentation/EMERCHANTPAY-API.md)** - How transactions, descriptors, and voiding work
- **[Database Schema](./documentation/DATABASE-SCHEMA.md)** - MongoDB collections and data structures
- **[Batch Synchronization](./documentation/BATCH-SYNCHRONIZATION.md)** - How batch processing and reconciliation work
- **[Chargeback Management](./documentation/BATCH-CHARGEBACKS-FINAL.md)** - Chargeback detection and handling
- **[Analytics](./documentation/ANALYTICS-DEBUG.md)** - Analytics implementation and debugging

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net
MONGODB_DB=melinux_emp

# emerchantpay Genesis API
EMP_GENESIS_ENDPOINT=https://gate.emerchantpay.net
EMP_GENESIS_TERMINAL_TOKEN=your_terminal_token
EMP_GENESIS_USERNAME=your_username
EMP_GENESIS_PASSWORD=your_password

# Notification & Return URLs
EMP_NOTIFICATION_URL=https://yourdomain.com/api/emp/notifications
EMP_RETURN_BASE_URL=https://yourdomain.com/emp

# Session (for admin auth)
SESSION_SECRET=your_random_secret_key_here
```

### Company Configuration

The system supports multiple companies with different configurations:

- **BestWin**: Detected by filename containing "bestwin"
  - Site: `https://bestwin.team`
  - Email: `Info@bestwin.team`
  - Descriptor: "bestwin"

- **Grand Luck**: Detected by filename containing "grandluck", "grand-luck", or "grand_luck"
  - Site: `https://www.grand-luck-service.com`
  - Email: `info@grand-luck-service.com`
  - Descriptor: "Grand Luck Service"

- **MeLinux** (default): All other files
  - Uses environment variable defaults

Company detection is automatic based on the uploaded CSV filename.

## 🔐 Security

- All API credentials are stored securely in environment variables
- IBAN masking in logs (shows only first 4 and last 4 characters)
- Basic authentication for emerchantpay API
- Session-based authentication for admin dashboard
- MongoDB connection pooling with automatic reconnection

## 🧪 Development

### Running Tests

```bash
pnpm test
```

### Building for Production

```bash
pnpm build
pnpm start
```

### Linting

```bash
pnpm lint
```

## 📊 CSV Format

The system accepts CSV files with the following fields (customizable via field mapping):

### Required Fields
- `iban` - Customer's IBAN
- `amount` - Transaction amount (in major currency units, e.g., 99.00 for €99)
- `currency` - Currency code (e.g., EUR)

### Optional Fields
- `first_name`, `last_name` - Customer name
- `email` - Customer email
- `address`, `zip_code`, `city`, `country` - Billing address
- `vzweck` / `usage` - Transaction description
- `product_descriptor` / `vzweck1` - Dynamic descriptor for bank statement
- `shopper_id` / `customer_id` - Unique customer identifier
- `due_date` - Payment due date

### Example CSV

```csv
iban,amount,currency,first_name,last_name,email,vzweck,product_descriptor
DE29731900000005021715,89.00,EUR,Klaus,Schmid,klaus@example.com,Membership Fee,Grand Luck Service
```

## 🛠️ Utilities

### CSV Diff Tool

Compare two CSV files and find differences:

```bash
python .tools/csv_diff.py file1.csv file2.csv output.csv --mode file2-only --key iban
```

See `.tools/README.md` for full documentation.

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "Add feature"`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a Pull Request

## 📞 Support

For technical issues:
- Check the documentation in `/documentation`
- Review logs in MongoDB `emp_uploads` collection
- Contact emerchantpay support: tech-support@emerchantpay.com

## 📝 License

Proprietary - All rights reserved

---

**Version**: 2.0  
**Last Updated**: November 2025  
**Maintained by**: MeLinux Development Team

