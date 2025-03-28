// IP blacklist middleware
// This middleware checks if the request IP is in the blacklist
// and blocks access if it is

// Blacklisted IPs (example - in a real application, this would be in a database or config file)
const blacklistedIPs = [
  // Add IPs to blacklist here
  // '192.168.1.1',
  // '10.0.0.1'
];

// Optional: IP allow list (only these IPs can access certain routes)
const allowedIPs = [
  // Add IPs to allow list here
  // '127.0.0.1'
];

/**
 * Middleware to block blacklisted IPs
 */
exports.blockBlacklistedIPs = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (blacklistedIPs.includes(ip)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  next();
};

/**
 * Middleware to only allow specific IPs (useful for admin routes)
 */
exports.restrictToAllowedIPs = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (!allowedIPs.includes(ip)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  next();
};

/**
 * Add an IP to the blacklist (dynamic blacklisting)
 */
exports.addToBlacklist = (ip) => {
  if (!blacklistedIPs.includes(ip)) {
    blacklistedIPs.push(ip);
  }
};

/**
 * Remove an IP from the blacklist
 */
exports.removeFromBlacklist = (ip) => {
  const index = blacklistedIPs.indexOf(ip);
  if (index > -1) {
    blacklistedIPs.splice(index, 1);
  }
}; 