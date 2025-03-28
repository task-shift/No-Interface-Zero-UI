const supabase = require('../config/supabase');

describe('Supabase Connection', () => {
  test('should connect to Supabase successfully', async () => {
    // Test basic query to verify connection
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    // We're just checking if the query executes without error
    expect(error).toBeNull();
    // data might be empty array if table is empty, that's fine
    expect(data).toBeDefined();
  });
}); 