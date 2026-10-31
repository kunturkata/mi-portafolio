const encoder = new TextEncoder();
const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE = 86400;

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function importKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(payload, secret) {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verify(payload, signature, secret) {
  const key = await importKey(secret);
  return crypto.subtle.verify('HMAC', key, base64UrlDecode(signature), encoder.encode(payload));
}

export function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

function isSecureRequest(request) {
  return new URL(request.url).protocol === 'https:';
}

export function timingSafeStringEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  return timingSafeEqual(a, b);
}

export async function createSessionCookie(request, env) {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = base64UrlEncode(nonceBytes);
  const payload = `${expires}.${nonce}`;
  const signature = await sign(payload, env.ADMIN_PASSWORD);
  const secure = isSecureRequest(request) ? '; Secure' : '';
  return `${SESSION_COOKIE}=${payload}.${signature}; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie(request) {
  const secure = isSecureRequest(request) ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=0`;
}

export async function verifySession(request, env) {
  if (!env.ADMIN_PASSWORD) return false;

  const value = getCookie(request, SESSION_COOKIE);
  if (!value) return false;

  const parts = value.split('.');
  if (parts.length !== 3) return false;

  const [expires, nonce, signature] = parts;
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !nonce || !signature) return false;

  try {
    return await verify(`${expires}.${nonce}`, signature, env.ADMIN_PASSWORD);
  } catch {
    return false;
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}
