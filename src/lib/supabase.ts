/**
 * Supabase Client Configuration & Healthcheck Helper
 * Safely initializes Supabase client when valid credentials are provided.
 * Falls back gracefully when unconfigured, allowing offline/local demo mode.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ENV_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Local storage override for testing credentials directly in the UI if needed
const STORAGE_OVERRIDE_URL_KEY = 'campuspulse_custom_supabase_url';
const STORAGE_OVERRIDE_KEY_KEY = 'campuspulse_custom_supabase_key';

export function getSupabaseCredentials(): { url: string; key: string; source: 'env' | 'custom' | 'none' } {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_OVERRIDE_URL_KEY) || '' : '';
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_OVERRIDE_KEY_KEY) || '' : '';

  if (customUrl && customKey) {
    return { url: customUrl.trim(), key: customKey.trim(), source: 'custom' };
  }

  if (ENV_URL && ENV_ANON_KEY && !ENV_URL.includes('your-project-id') && !ENV_ANON_KEY.includes('your-supabase-anon-key')) {
    return { url: ENV_URL.trim(), key: ENV_ANON_KEY.trim(), source: 'env' };
  }

  return { url: '', key: '', source: 'none' };
}

export function saveCustomCredentials(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem(STORAGE_OVERRIDE_URL_KEY, url.trim());
      localStorage.setItem(STORAGE_OVERRIDE_KEY_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_OVERRIDE_URL_KEY);
      localStorage.removeItem(STORAGE_OVERRIDE_KEY_KEY);
    }
  }
}

export function clearCustomCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_OVERRIDE_URL_KEY);
    localStorage.removeItem(STORAGE_OVERRIDE_KEY_KEY);
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedCredentialsHash = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  const hash = `${url}:${key}`;
  if (cachedClient && cachedCredentialsHash === hash) {
    return cachedClient;
  }

  try {
    // Validate valid URL format
    new URL(url);
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedCredentialsHash = hash;
    return cachedClient;
  } catch (err) {
    console.warn('Invalid Supabase configuration URL', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

export function getSupabaseConfig(): { url: string; key: string; source: 'env' | 'custom' | 'none' } {
  return getSupabaseCredentials();
}
