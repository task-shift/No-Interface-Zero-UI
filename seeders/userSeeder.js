const supabase = require('../config/supabase');

// Sample user data
const users = [
  {
    email: 'user1@example.com',
    password: 'hashedpassword1', // In a real app, you would hash these passwords
    full_name: 'User One'
  },
  {
    email: 'user2@example.com',
    password: 'hashedpassword2',
    full_name: 'User Two'
  },
  {
    email: 'user3@example.com',
    password: 'hashedpassword3',
    full_name: 'User Three'
  }
];

async function seedUsers() {
  try {
    console.log('Seeding users table...');
    
    // Optional: Clear existing data
    // Note: This requires RLS policies that allow deletion or direct SQL execution rights
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .not('id', 'is', null); // Delete all records
    
    if (deleteError) {
      console.error('Error clearing users table:', deleteError);
      return;
    }
    
    // Insert users
    for (const user of users) {
      const { data, error } = await supabase
        .from('users')
        .insert([user]);
      
      if (error) {
        console.error('Error inserting user:', error);
      }
    }
    
    console.log('Users table seeded successfully!');
  } catch (error) {
    console.error('Error seeding users table:', error);
  }
}

module.exports = seedUsers; 