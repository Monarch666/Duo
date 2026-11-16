/**
 * Google OAuth Authentication for Duo Sanctuary
 * Handles Google Sign-In with minimal scope: 'https://www.googleapis.com/auth/drive.file'
 * Supports both Web browser (Google Identity Services) and Native Android (Capacitor).
 */

import { GoogleUser } from './types';

const STORAGE_KEY = 'duo_google_user';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file email profile openid';

export function getStoredGoogleUser(): GoogleUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user: GoogleUser = JSON.parse(raw);
    // Return user even if token needs refresh (auth provider will refresh on demand)
    return user;
  } catch {
    return null;
  }
}

export function saveGoogleUser(user: GoogleUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearGoogleUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Checks whether the stored access token is still valid.
 */
export function isTokenValid(user: GoogleUser | null): boolean {
  if (!user || !user.accessToken) return false;
  // Buffer of 60 seconds before actual expiration
  return Date.now() < user.expiresAt - 60000;
}

/**
 * Initializes Google Sign-In on Web using Google Identity Services (GIS).
 */
export async function signInWithGoogleWeb(clientId: string): Promise<GoogleUser> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    // Load GIS script if not present
    const loadScript = () => {
      if ((window as any).google?.accounts?.oauth2) {
        startOAuthFlow();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => startOAuthFlow();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    };

    const startOAuthFlow = () => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: DRIVE_FILE_SCOPE,
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              return reject(new Error(tokenResponse.error_description || tokenResponse.error));
            }

            const accessToken = tokenResponse.access_token;
            const expiresIn = Number(tokenResponse.expires_in) || 3600;
            const expiresAt = Date.now() + expiresIn * 1000;

            // Fetch user profile from Google userinfo endpoint
            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const profile = await profileRes.json();

              const user: GoogleUser = {
                id: profile.sub,
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                givenName: profile.given_name,
                familyName: profile.family_name,
                imageUrl: profile.picture,
                accessToken,
                expiresAt,
              };

              saveGoogleUser(user);
              resolve(user);
            } catch (profileErr) {
              reject(profileErr);
            }
          },
        });

        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    };

    loadScript();
  });
}

/**
 * Universal sign-in handler that routes to Native or Web flow.
 */
export async function signInWithGoogle(webClientId: string): Promise<GoogleUser> {
  // Check if running under Capacitor Native
  const isCapacitor =
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.();

  if (isCapacitor) {
    try {
      // Dynamic import for capacitor google auth plugin if available
      // @ts-ignore - optional native capacitor plugin
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.initialize({
        clientId: webClientId,
        scopes: [DRIVE_FILE_SCOPE],
        grantOfflineAccess: true,
      });
      const googleUser = await GoogleAuth.signIn();

      const user: GoogleUser = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name || googleUser.givenName || 'Partner',
        givenName: googleUser.givenName,
        familyName: googleUser.familyName,
        imageUrl: googleUser.imageUrl,
        accessToken: googleUser.authentication.accessToken,
        expiresAt: Date.now() + 3600 * 1000,
      };

      saveGoogleUser(user);
      return user;
    } catch (nativeErr) {
      console.warn('Native Google Auth failed, falling back to Web OAuth:', nativeErr);
    }
  }

  // Fallback to Web OAuth
  return signInWithGoogleWeb(webClientId);
}
