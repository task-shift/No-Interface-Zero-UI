const supabase = require('../config/supabase');

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test if we can connect and query
    const { data, error } = await supabase.from('users').select('count').single();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('User count:', data ? data.count : 'Table empty or not found');
    
    // Test service status
    const { data: health, error: healthError } = await supabase.rpc('get_service_status');
    
    if (healthError) {
      console.log('❌ Could not check service status:', healthError.message);
    } else {
      console.log('Service status:', health);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection(); 