const supabase = require('../config/supabase');

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
    
    // Get organization ID from current_organization_id
    let orgId = req.user.current_organization_id;
    
    // If current_organization_id is not set, return error
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'No current organization set. Please set a current organization first.'
      });
    }

    // Check user's permission in the organization_members table
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role, permission')
      .eq('organization_id', orgId)
      .eq('user_id', req.user.user_id)
      .eq('status', 'active')
      .single();

    if (memberError || !memberData) {
      console.error('Error checking organization permission:', memberError || 'Not a member');
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required for this action' 
      });
    }
    
    // Check if user has admin permission in the organization
    if (memberData.permission !== 'admin') {
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
    
    // Get organization ID from current_organization_id
    let orgId = req.user.current_organization_id;
    
    // If current_organization_id is not set, return error
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'No current organization set. Please set a current organization first.'
      });
    }

    // Check user's permission in the organization_members table
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role, permission')
      .eq('organization_id', orgId)
      .eq('user_id', req.user.user_id)
      .eq('status', 'active')
      .single();

    if (memberError || !memberData) {
      console.error('Error checking organization permission:', memberError || 'Not a member');
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required for this action' 
      });
    }
    
    // Check if user has admin permission in the organization
    // For now we're treating both 'admin' and 'adminx' as the same permission level
    if (memberData.permission !== 'admin') {
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