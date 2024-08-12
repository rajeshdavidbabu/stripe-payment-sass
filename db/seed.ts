import { db } from './index';
import { users } from './schema';

async function seed() {
  try {
    await db.insert(users).values([
      {
        email: 'user1@example.com',
        type: 'free',
        subscription: null,
        tokens: 0,
      },
      {
        email: 'user2@example.com',
        type: 'free',
        subscription: null,
        tokens: 0,
      },
      {
        email: 'user3@example.com',
        type: 'free',
        subscription: null,
        tokens: 0,
      },
    ]);

    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seed();