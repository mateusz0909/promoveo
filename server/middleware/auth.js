const { supabase } = require('../lib/clients.js');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  req.user = user; // Attach user object to the request
  next();
};

const normalizeRoles = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).toLowerCase());
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

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
        console.warn('Failed to parse roles metadata', error);
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

const hasAdminRole = (metadata) => {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  const explicitFlag = metadata.isAdmin ?? metadata.is_admin ?? metadata.admin;
  if (typeof explicitFlag === 'boolean' && explicitFlag) {
    return true;
  }
  if (typeof explicitFlag === 'string' && explicitFlag.toLowerCase() === 'true') {
    return true;
  }

  const role = typeof metadata.role === 'string' ? metadata.role : null;
  if (role && role.toLowerCase() === 'admin') {
    return true;
  }

  const candidates = [metadata.roles, metadata.claims];
  for (const candidate of candidates) {
    const roles = normalizeRoles(candidate);
    if (roles.includes('admin')) {
      return true;
    }
  }

  return false;
};

const requireAdmin = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const isAdmin = hasAdminRole(user.app_metadata) || hasAdminRole(user.user_metadata);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }

  next();
};

module.exports = { requireAuth, requireAdmin };
