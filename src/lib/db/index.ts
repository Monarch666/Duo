import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Global reference to prevent multiple connections during Next.js hot reloading
declare global {
  // eslint-disable-next-line no-var
  var __pgClientInstance: ReturnType<typeof postgres> | undefined;
}

import fs from 'fs';

function getConnectionString(): string {
  if (!process.env.DATABASE_URL) {
    try {
      if (fs.existsSync('.env.local')) {
        process.loadEnvFile('.env.local');
      } else if (fs.existsSync('.env')) {
        process.loadEnvFile('.env');
      }
    } catch {
      // Ignore if loadEnvFile fails
    }
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
      'Set it to your Supabase PostgreSQL connection string.'
    );
  }
  return url;
}

function createClient() {
  if (global.__pgClientInstance && process.env.NODE_ENV !== 'production') {
    return global.__pgClientInstance;
  }

  const connectionString = getConnectionString();

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Required for Supabase transaction pooler
  });

  if (process.env.NODE_ENV !== 'production') {
    global.__pgClientInstance = client;
  }

  return client;
}

const pgClient = createClient();
export const db = drizzle(pgClient, { schema });
export type DatabaseInstance = typeof db;
