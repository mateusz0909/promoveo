#!/usr/bin/env node
/*
 * Utility script to grant admin access to a Supabase user.
 * Usage:
 *   npm run set-admin -- email@example.com
 *   npm run set-admin -- uid-123
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const ROOT_ENV = path.resolve(__dirname, '../../.env');
const SERVER_ENV = path.resolve(__dirname, '../.env');

if (fs.existsSync(ROOT_ENV)) {
  dotenv.config({ path: ROOT_ENV, override: false });
}

if (fs.existsSync(SERVER_ENV)) {
  dotenv.config({ path: SERVER_ENV, override: true });
}

const identifier = process.argv[2];

if (!identifier) {
  console.error('❌  Missing identifier. Provide an email address or user ID.');
  process.exit(1);
}

const { SUPABASE_URL } = process.env;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) must be set in the environment.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const normalizeRoles = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).toLowerCase());
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).toLowerCase());
        }
        if (parsed && typeof parsed === 'object') {
          return Object.values(parsed).map((item) => String(item).toLowerCase());
        }
      } catch (error) {
        console.warn('⚠️  Failed to parse roles metadata', error.message);
      }
    }

    return trimmed
      .split(/[\s,;]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof value === 'object') {
    return Object.values(value).map((item) => String(item).toLowerCase());
  }

  return [String(value).toLowerCase()];
};

const buildUpdatedRoles = (existing) => {
  const roles = new Set(normalizeRoles(existing));
  roles.add('admin');
  return Array.from(roles);
};

const findUserByEmail = async (email) => {
  const targetEmail = email.toLowerCase();
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail);
    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
};

const markAdmin = async () => {
  const identifierLower = identifier.toLowerCase();
  const isEmail = identifierLower.includes('@');

  let user;
  try {
    if (isEmail) {
      user = await findUserByEmail(identifierLower);
    } else {
      const { data, error } = await supabase.auth.admin.getUserById(identifier);
      if (error) {
        throw error;
      }
      user = data.user;
    }
  } catch (error) {
    console.error('❌  Failed to locate user:', error.message);
    process.exit(1);
  }

  if (!user) {
    console.error(`❌  No user found for identifier "${identifier}".`);
    process.exit(1);
  }

  const updatedAppMeta = {
    ...(user.app_metadata || {}),
    roles: buildUpdatedRoles(user.app_metadata?.roles),
  };

  const updatedUserMeta = {
    ...(user.user_metadata || {}),
    roles: buildUpdatedRoles(user.user_metadata?.roles),
  };

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: updatedAppMeta,
      user_metadata: updatedUserMeta,
    });

    if (error) {
      throw error;
    }

    console.log('✅  Admin role granted successfully.');
    console.log('   User ID:', data.user.id);
    console.log('   Email:', data.user.email);
    console.log('   app_metadata.roles:', data.user.app_metadata?.roles);
    console.log('   user_metadata.roles:', data.user.user_metadata?.roles);
  } catch (error) {
    console.error('❌  Failed to update user:', error.message);
    process.exit(1);
  }
};

markAdmin();
