// Middleware to check if user is an admin
exports.requireAdmin = async (req, res, next) => {
  try {
    // User object is added by the requireAuth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required for this action' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization error' 
    });
  }
};

// Middleware to check if user is either an admin or adminx
exports.requireAdminOrAdminX = async (req, res, next) => {
  try {
    // User object is added by the requireAuth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Check if user is an admin or adminx
    if (req.user.role !== 'admin' && req.user.role !== 'adminx') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required for this action' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization error' 
    });
  }
}; 