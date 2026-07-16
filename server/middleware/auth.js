const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'dev-y8cbnyejlrsean26.us.auth0.com';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

// Middleware: verifies Auth0 JWT from Authorization header
// Sets req.user with { sub, email, email_verified, name, ... }
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['RS256'],
      issuer: `https://${AUTH0_DOMAIN}/`,
    },
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified,
        name: decoded.name || decoded.nickname || decoded.email,
      };
      req.isAdmin = ADMIN_EMAILS.includes(decoded.email);
      next();
    }
  );
}

// Optional auth: sets req.user if token present, but doesn't block
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    req.isAdmin = false;
    return next();
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['RS256'],
      issuer: `https://${AUTH0_DOMAIN}/`,
    },
    (err, decoded) => {
      if (err) {
        req.user = null;
        req.isAdmin = false;
      } else {
        req.user = {
          sub: decoded.sub,
          email: decoded.email,
          email_verified: decoded.email_verified,
          name: decoded.name || decoded.nickname || decoded.email,
        };
        req.isAdmin = ADMIN_EMAILS.includes(decoded.email);
      }
      next();
    }
  );
}

module.exports = { requireAuth, optionalAuth };
