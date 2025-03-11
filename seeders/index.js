const seedUsers = require('./userSeeder');

async function runSeeders() {
  try {
    console.log('Starting database seeding...');
    
    // Run seeders in sequence
    await seedUsers();
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

runSeeders(); 