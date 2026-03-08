/**
 * ══════════════════════════════════════════════════════════
 * La Ganga – Backend Proxy Server
 * ══════════════════════════════════════════════════════════
 *
 * This minimal Express server acts as a secure backend proxy for:
 *   1. Kick OAuth2 token exchange (authorization_code → access_token)
 *   2. Kick API calls that require the Client Secret
 *   3. Kick webhook signature verification and Discord forwarding
 *
 * ⚠️ SEGURIDAD:
 *   - El Client Secret NUNCA debe ir en el frontend.
 *   - Carga las credenciales desde variables de entorno (.env).
 *   - Verifica la firma del webhook antes de procesar eventos.
 *
 * SETUP:
 *   1. cp .env.example .env   (y rellena los valores reales)
 *   2. npm install
 *   3. npm start
 * ══════════════════════════════════════════════════════════
 */

'use strict';

require('dotenv').config();

const express = require('express');
const crypto  = require('crypto');
const axios   = require('axios');

const app  = express();
const PORT = process.env.PORT || 3001;

const KICK_CLIENT_ID     = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
const REDIRECT_URI       = process.env.REDIRECT_URI;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const ALLOWED_ORIGINS    = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

// ── Middleware ────────────────────────────────────────────
app.use(express.json());

// Simple CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!ALLOWED_ORIGINS.length) {
    // No explicit origins configured – log a warning and allow all (dev mode only)
    console.warn('[CORS] ⚠️  ALLOWED_ORIGINS is not set. Allowing all origins. Set it in .env for production.');
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── OAuth2: Exchange authorization code for access token ──
//
// The frontend (implicit flow) receives the token directly via URL hash.
// This endpoint is for the authorization_code flow (more secure):
//
//   POST /auth/token
//   Body: { code: "authorization_code_from_kick" }
//
//   Returns: { access_token, token_type, expires_in, refresh_token, scope }
//
app.post('/auth/token', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const response = await axios.post(
      'https://id.kick.com/oauth/token',
      new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        client_id:     KICK_CLIENT_ID,
        client_secret: KICK_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    res.json(response.data);
  } catch (err) {
    console.error('[/auth/token] Error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Token exchange failed', detail: err.response?.data });
  }
});

// ── Kick API Proxy: channel info (uses client credentials) ─
//
//   GET /api/channel/:slug
//
//   Returns the channel + livestream data from Kick API v2.
//
app.get('/api/channel/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const response = await axios.get(
      `https://api.kick.com/public/v1/channels?broadcaster_user_login=${slug}`,
      {
        headers: {
          Accept: 'application/json',
          // If you have a server-side token, include it here:
          // Authorization: `Bearer ${SERVER_ACCESS_TOKEN}`,
          'Client-Id': KICK_CLIENT_ID,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('[/api/channel] Error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Kick API request failed', detail: err.response?.data });
  }
});

// ── Kick Webhook Handler ───────────────────────────────────
//
// Configure this URL in the Kick Developer Portal:
//   https://your-server.com/kick-webhook
//
// Kick will POST events here. Key events:
//   - "stream.online"  → streamer goes live
//   - "stream.offline" → streamer goes offline
//
// The signature is sent in the header: Kick-Event-Signature
// It is an HMAC-SHA256 of the raw request body, signed with the Client Secret.
//
app.post('/kick-webhook', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
  // 1. Verify the signature
  const signature = req.headers['kick-event-signature'];
  if (KICK_CLIENT_SECRET && signature) {
    const expectedSig = crypto
      .createHmac('sha256', KICK_CLIENT_SECRET)
      .update(req.body)
      .digest('hex');
    if (signature !== `sha256=${expectedSig}`) {
      console.warn('[webhook] Invalid signature – ignoring event');
      return res.sendStatus(403);
    }
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.sendStatus(400);
  }

  console.log('[webhook] Received event:', event.type, event.data?.broadcaster_user_login || '');

  // 2. Handle stream.online → notify Discord
  if (event.type === 'stream.online' && DISCORD_WEBHOOK_URL) {
    const { broadcaster_user_login, broadcaster_user_name } = event.data || {};
    const name = broadcaster_user_name || broadcaster_user_login || 'Unknown';

    axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [{
        title:       `🟢 ${name} está EN VIVO en Kick!`,
        description: `**${name}** acaba de conectarse.\nhttps://kick.com/${broadcaster_user_login}`,
        color:       0x53fc18, // neon green
        timestamp:   new Date().toISOString(),
        footer:      { text: 'La Ganga Dashboard' },
      }],
    }).catch(err => {
      console.error('[webhook] Discord notify error:', err.message);
    });
  }

  // 3. Handle stream.offline → notify Discord
  if (event.type === 'stream.offline' && DISCORD_WEBHOOK_URL) {
    const { broadcaster_user_login, broadcaster_user_name } = event.data || {};
    const name = broadcaster_user_name || broadcaster_user_login || 'Unknown';

    axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [{
        title:       `⚫ ${name} se fue Offline`,
        description: `**${name}** terminó su stream.`,
        color:       0x6b7280, // gray
        timestamp:   new Date().toISOString(),
        footer:      { text: 'La Ganga Dashboard' },
      }],
    }).catch(err => {
      console.error('[webhook] Discord notify error:', err.message);
    });
  }

  res.sendStatus(200);
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[La Ganga backend] Listening on port ${PORT}`);
  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
    console.warn('[La Ganga backend] ⚠️  KICK_CLIENT_ID or KICK_CLIENT_SECRET not set – check your .env file');
  }
});
