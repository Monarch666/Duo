import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let clientInstance: SupabaseClient | null = null;
let bucketInitialized = false;

export function getSupabaseStorageClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return clientInstance;
}

/**
 * Ensure the public 'memories' bucket exists in Supabase Storage.
 */
async function ensureBucketExists(supabase: SupabaseClient): Promise<boolean> {
  if (bucketInitialized) return true;
  try {
    const { error } = await supabase.storage.createBucket('memories', {
      public: true,
      fileSizeLimit: 15 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (!error || error.message?.toLowerCase().includes('already exists')) {
      bucketInitialized = true;
      return true;
    }
    console.warn('[Supabase Storage] Notice creating bucket:', error.message);
    // Even if createBucket returns an error (e.g. requires admin role), try using it anyway
    bucketInitialized = true;
    return true;
  } catch (err: any) {
    console.warn('[Supabase Storage] Bucket check skipped:', err?.message);
    bucketInitialized = true;
    return true;
  }
}

export interface UploadResult {
  url: string;
  filename: string;
  storage: 'supabase' | 'local';
}

/**
 * Upload a memory photograph directly to Supabase Storage with global CDN distribution.
 * Returns null if Supabase is unavailable or encounters an error, triggering fallback.
 */
export async function uploadToSupabaseStorage(
  coupleId: string,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult | null> {
  const supabase = getSupabaseStorageClient();
  if (!supabase) return null;

  try {
    await ensureBucketExists(supabase);

    const objectPath = `${coupleId}/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(objectPath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Supabase Storage] Upload failed, falling back to local disk:', uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('memories')
      .getPublicUrl(objectPath);

    return {
      url: publicUrlData.publicUrl,
      filename,
      storage: 'supabase',
    };
  } catch (err: any) {
    console.warn('[Supabase Storage] Exception during upload, falling back to local disk:', err?.message);
    return null;
  }
}
