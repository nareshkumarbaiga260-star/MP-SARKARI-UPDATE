import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';

export const AUTHORIZED_ADMIN_EMAIL = 'nareshkumarbaiga260@gmail.com';

interface FirebaseConfigFile {
  apiKey: string;
  projectId: string;
  firestoreDatabaseId?: string;
}

let cachedApiKey: string | null = null;
const tokenVerifyCache = new Map<string, { email: string; verified: boolean; expiresAt: number }>();

function getFirebaseApiKey(): string {
  if (cachedApiKey) return cachedApiKey;
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const raw = fs.readFileSync(cfgPath, 'utf8');
  const parsed = JSON.parse(raw) as FirebaseConfigFile;
  cachedApiKey = parsed.apiKey;
  return cachedApiKey;
}

export interface AuthenticatedAdminRequest extends Request {
  adminEmail?: string;
}

export async function verifyFirebaseAdminToken(idToken: string): Promise<{
  ok: boolean;
  email?: string;
  status?: number;
  error?: string;
}> {
  const token = idToken.trim();
  if (!token) {
    return { ok: false, status: 401, error: 'Missing Authorization token.' };
  }

  const cached = tokenVerifyCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.verified && cached.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL) {
      return { ok: true, email: cached.email };
    }
    return { ok: false, status: 403, error: 'Unauthorized administrator account.' };
  }

  try {
    const apiKey = getFirebaseApiKey();
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(5000)
      }
    );

    if (!res.ok) {
      return { ok: false, status: 401, error: 'Invalid or expired Firebase ID token.' };
    }

    const payload = (await res.json()) as {
      users?: Array<{ email?: string; emailVerified?: boolean; disabled?: boolean }>;
    };
    const user = payload.users?.[0];
    if (!user || !user.email || user.disabled) {
      return { ok: false, status: 401, error: 'Firebase user record not found or disabled.' };
    }

    const email = user.email.toLowerCase();
    const verified = Boolean(user.emailVerified);

    tokenVerifyCache.set(token, {
      email,
      verified,
      expiresAt: Date.now() + 2 * 60 * 1000
    });

    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      return {
        ok: false,
        status: 403,
        error: `अनधिकृत खाता (${user.email})। केवल ${AUTHORIZED_ADMIN_EMAIL} ही अधिकृत है।`
      };
    }

    if (!verified) {
      return {
        ok: false,
        status: 403,
        error: 'एडमिन ईमेल सत्यापित (Email Verified) नहीं है। कृपया पहले ईमेल सत्यापित करें।'
      };
    }

    return { ok: true, email: user.email };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: err instanceof Error ? err.message : 'Firebase token verification failed.'
    };
  }
}

export async function requireAuthorizedAdmin(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    res.status(401).json({
      error: 'एडमिन प्रमाणीकरण आवश्यक है (Missing Bearer Firebase ID Token)।'
    });
    return;
  }

  const check = await verifyFirebaseAdminToken(match[1]);
  if (!check.ok) {
    res.status(check.status || 403).json({ error: check.error || 'Forbidden' });
    return;
  }

  req.adminEmail = check.email;
  next();
}
