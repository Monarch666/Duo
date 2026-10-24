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
  let url = process.env.DATABASE_URL;
  if (!url) {
    // Safe placeholder during static compilation/build phase so worker import doesn't throw
    return 'postgresql://postgres:postgres@localhost:5432/postgres';
  }

  // Next.js dotenv-expand may treat $agiyoichi1602 as an environment variable and replace it with ""
  if (url.includes(':I@')) {
    url = url.replace(':I@', ':I$agiyoichi1602@');
  } else if (url.includes(':I\\$agiyoichi1602@')) {
    url = url.replace(':I\\$agiyoichi1602@', ':I$agiyoichi1602@');
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
