# High-Performance Batch Sync

## Problem Solved

**Vercel serverless functions have time limits:**
- **Hobby tier**: 60 seconds max
- **Pro tier**: 300 seconds (5 minutes) max

**With 2000 transactions at 3 parallel requests**, the old system would take ~11 minutes, which **exceeds** Vercel limits and would fail.

## Solution: Chunked Batch Processing

### How It Works

1. **Process in chunks** of 500 records per API call
2. **High concurrency** (10 parallel requests instead of 3)
3. **Resume from last position** if interrupted
4. **Track progress** in real-time
5. **Auto-continue** until all records are processed

### Performance Comparison

#### Old System (Sequential)
```
2000 transactions
÷ 3 (concurrency)
× 2 seconds per request
= ~22 minutes ❌ (exceeds 60s limit)
```

#### New System (Chunked)
```
2000 transactions
÷ 10 (concurrency per chunk)
× 0.5 seconds per request
= ~100 seconds total

Split into 4 chunks:
Chunk 1: 500 records × 50s = 50s ✅
Chunk 2: 500 records × 50s = 50s ✅
Chunk 3: 500 records × 50s = 50s ✅
Chunk 4: 500 records × 50s = 50s ✅
Total: ~3.5 minutes (with 0.5s delays between chunks)
```

## Features

### 1. **Resumable Processing**
If a chunk times out or fails, the next call picks up where it left off.

**Database tracking:**
```javascript
{
  lastBatchAt: Date,
  lastBatchPosition: 1000, // Resume from row 1000
  rows: [
    { status: 'approved', ... }, // Row 0-999
    { status: 'pending', ... },  // Row 1000+ (not processed yet)
  ]
}
```

### 2. **Real-Time Progress**
Visual progress bar shows:
- Current batch number
- Percentage complete
- Records processed / total

### 3. **Error Handling**
- Continues processing even if some rows fail
- Collects all errors
- Shows summary at the end

### 4. **Smart Time Management**
- Monitors execution time
- Stops gracefully before timeout
- Returns `hasMore: true` and `nextStart` for continuation

## Usage

### From UI (Recommended)

Click the **"Batch Sync with EMP"** button on any upload detail page.

The button will:
1. Show progress bar
2. Process all chunks automatically
3. Display toast notifications for each batch
4. Show final summary

### From API

**Manual chunk processing:**

```bash
# Process first chunk (rows 0-499)
POST /api/emp/submit-batch/[uploadId]
{
  "startFrom": 0,
  "batchSize": 500
}

# Process second chunk (rows 500-999)
POST /api/emp/submit-batch/[uploadId]
{
  "startFrom": 500,
  "batchSize": 500
}

# And so on...
```

**Response:**
```json
{
  "ok": true,
  "processed": 500,
  "errors": [],
  "errorCount": 0,
  "hasMore": true,
  "nextStart": 500,
  "progress": {
    "total": 2000,
    "currentBatch": { "start": 0, "end": 500 },
    "approved": 490,
    "errors": 10,
    "pending": 1500
  },
  "runtime": 48234
}
```

## Configuration

### Concurrency

In `/app/api/emp/submit-batch/[id]/route.ts`:

```typescript
const CONCURRENCY = 10 // Adjust based on API rate limits
```

**Higher concurrency** = faster but more load on EMP
**Lower concurrency** = slower but safer

### Batch Size

```typescript
const batchSize = body?.batchSize || 500
```

**Larger batches** = fewer API calls but longer per-call runtime
**Smaller batches** = more API calls but safer for timeouts

### Timeout Buffer

```typescript
const MAX_RUNTIME = 50000 // 50s for 60s limit
```

Leaves a 10-second buffer for:
- Database updates
- Response generation
- Network latency

## API Endpoints

### `/api/emp/submit-batch/[id]` (NEW)
**High-performance chunked batch processing**
- 10x parallel concurrency
- Resumable
- Time-aware
- Progress tracking

### `/api/emp/submit/[id]` (OLD)
**Original single-batch processing**
- 3x parallel concurrency
- Stops on first error
- No progress tracking
- Still available for smaller uploads

## When to Use Each

### Use Batch Sync (`/api/emp/submit-batch/[id]`) for:
- ✅ Large uploads (500+ records)
- ✅ Production environments
- ✅ Long-running jobs
- ✅ Resumable processing

### Use Regular Sync (`/api/emp/submit/[id]`) for:
- ✅ Small uploads (<100 records)
- ✅ Testing/debugging
- ✅ Quick one-offs

## Database Schema

### Upload Document Updates

```javascript
{
  _id: ObjectId,
  records: [...],
  rows: [
    {
      status: 'approved' | 'error' | 'pending' | 'submitted',
      attempts: 2,
      lastAttemptAt: ISODate("2025-10-17T..."),
      emp: {
        uniqueId: "abc123",
        message: "Success",
        technicalMessage: "..."
      }
    }
  ],
  approvedCount: 1950,
  errorCount: 50,
  lastBatchAt: ISODate("2025-10-17T..."),
  lastBatchPosition: 2000,
  updatedAt: ISODate("2025-10-17T...")
}
```

## Example: 2000 Record Upload

### Timeline

```
00:00 - User clicks "Batch Sync with EMP"
00:01 - Chunk 1 starts (rows 0-499, 10 parallel)
00:50 - Chunk 1 complete: 490 approved, 10 errors
00:51 - Chunk 2 starts (rows 500-999)
01:40 - Chunk 2 complete: 495 approved, 5 errors
01:41 - Chunk 3 starts (rows 1000-1499)
02:30 - Chunk 3 complete: 498 approved, 2 errors
02:31 - Chunk 4 starts (rows 1500-1999)
03:20 - Chunk 4 complete: 499 approved, 1 error
03:21 - DONE: 1982 approved, 18 errors
```

**Total time: ~3.5 minutes** ✅
**Success rate: 99.1%** 🎉

## Monitoring

Watch the browser console during batch sync to see:
- Batch numbers
- Processing times
- Error details
- Progress updates

## Future Enhancements

Potential improvements:
- **Background jobs** - Move to queue system (BullMQ, Redis)
- **Webhooks** - Notify when complete via webhook
- **Parallel chunks** - Process multiple chunks simultaneously
- **Rate limiting** - Adaptive concurrency based on API responses
- **Retry logic** - Auto-retry failed rows
- **Priority queues** - VIP uploads processed first

