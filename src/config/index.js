// ====================================================
// ENVIRONMENT CONFIGURATION
// ====================================================
// Centralized environment variable management with validation.
// Uses dotenv for loading and validates required variables.

import 'dotenv/config';

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  );
}

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL,

  // Database
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // Bcrypt
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    auth: {
      windowMs:
        parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
      maxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 10,
    },
  },

  // Cookies
  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: true, //process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 gün
  },

  // Security
  trustProxy: process.env.TRUST_PROXY === 'true',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Content Creation Cooldown (in seconds)
  cooldown: {
    topicSeconds: parseInt(process.env.TOPIC_COOLDOWN_SECONDS, 10) || 60,
    postSeconds: parseInt(process.env.POST_COOLDOWN_SECONDS, 10) || 15,
  },
};

// Freeze config to prevent modifications
Object.freeze(config);
Object.freeze(config.jwt);
Object.freeze(config.bcrypt);
Object.freeze(config.rateLimit);
Object.freeze(config.rateLimit.auth);
Object.freeze(config.cookie);
Object.freeze(config.supabase);
Object.freeze(config.cooldown);

export default config;
