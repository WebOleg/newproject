# 🚨 ACTION REQUIRED: Resync Chargebacks

## The Issue

Your batch chargeback analysis is showing **0 chargebacks per batch** because the existing cached chargebacks are missing the `originalTransactionUniqueId` field needed to link them back to their originating transactions.

## The Fix (Takes 2 Minutes)

### Step 1: Resync Chargebacks ⚡
1. Go to: `/emp/analytics`
2. Click the **"Resync CB"** button (top right)
3. Wait for the sync to complete (you'll see a success message)

### Step 2: View Batch Analysis 📊
1. Click the **"Batch Analysis"** button
2. You should now see chargeback counts per batch!

## What This Does

The resync will:
- Fetch all chargebacks from emerchantpay API again
- Store the new `originalTransactionUniqueId` field
- Enable proper matching between chargebacks and upload batches

## Before vs After

### Before Resync:
```
All batches: 0 chargebacks (❌ incorrect)
```

### After Resync:
```
buchungen Bestwin_FRST.csv: 127 chargebacks (8.77%)
MPS_CC_QC_Besdant_01.11.csv: 35 chargebacks (9.94%)
Grandluckservice.csv: 189 chargebacks (8.90%)
... (✅ correct)
```

## Technical Explanation

**Old behavior:**
- Tried to match `chargeback.uniqueId` (chargeback's ID) against `upload.row.emp.uniqueId` (original transaction's ID)
- These are DIFFERENT values → 0 matches

**New behavior:**
- Matches `chargeback.originalTransactionUniqueId` against `upload.row.emp.uniqueId`
- These are the SAME value → correct matches! 🎉

## Verification

After resyncing, you should see in the Batch Analysis page:

✅ Non-zero chargeback counts  
✅ Accurate chargeback rates  
✅ Expandable details showing reason codes  
✅ Correct total chargeback amounts  

## Need Help?

If still showing 0 after resync:
1. Check browser console (F12) for error messages
2. Check server logs for "Batch Chargebacks" entries
3. Verify date range covers your uploads

---

**TL;DR: Just click "Resync CB" on the analytics dashboard, then check "Batch Analysis"** 🚀



