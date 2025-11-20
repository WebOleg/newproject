import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb'

type MongoState = {
  client: MongoClient | null
  promise: Promise<MongoClient> | null
}

const globalForMongo = globalThis as unknown as { __mongo?: MongoState }
if (!globalForMongo.__mongo) {
  globalForMongo.__mongo = { client: null, promise: null }
}
const mongoState = globalForMongo.__mongo!

function getOptions(): MongoClientOptions {
  return {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    maxPoolSize: 10,
    minPoolSize: 0,
    retryWrites: true,
    socketTimeoutMS: 60000,
    serverSelectionTimeoutMS: 5000,
  }
}

async function connectNewClient(uri: string): Promise<MongoClient> {
  const client = new MongoClient(uri, getOptions())
  await client.connect()
  return client
}

/**
 * Wrapper to handle MongoDB errors gracefully
 */
export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    console.error(`[MongoDB] Error during ${operationName}:`, error)
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      throw new Error('Duplicate entry detected')
    }
    if (error.message?.includes('topology')) {
      throw new Error('Database connection lost. Please try again.')
    }
    if (error.message?.includes('timeout')) {
      throw new Error('Database operation timed out. Please try again.')
    }
    
    throw new Error(`Database error: ${error.message || 'Unknown error'}`)
  }
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  // Reuse a single promise across invocations to avoid creating many clients in serverless
  if (!mongoState.promise) {
    mongoState.promise = connectNewClient(uri).then((c) => (mongoState.client = c))
  }

  try {
    const client = await mongoState.promise
    // Validate connection (handles "topology closed" by throwing)
    await client.db(getDbName()).command({ ping: 1 })
    return client
  } catch {
    // Reconnect on failure
    mongoState.promise = connectNewClient(uri).then((c) => (mongoState.client = c))
    return await mongoState.promise
  }
}

export function getDbName(): string {
  return process.env.MONGODB_DB || 'melinux_emp'
}


