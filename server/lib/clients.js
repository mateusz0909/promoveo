// server/lib/clients.js
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();
// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Prisma client
const prisma = new PrismaClient();

module.exports = {
    supabase,
    prisma
}
