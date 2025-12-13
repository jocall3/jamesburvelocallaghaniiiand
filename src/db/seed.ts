import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('Seeding database...');

  // Seed administrative users
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Administrator',
      role: 'ADMIN',
    },
    create: {
      email: 'admin@example.com',
      name: 'Administrator',
      role: 'ADMIN',
      password: 'hashed_password_for_admin', // In a real app, use a strong hashing library
    },
  });
  console.log('Admin user seeded.');

  // Seed default book content
  const defaultBooks = [
    {
      title: 'The Hitchhiker\'s Guide to the Galaxy',
      author: 'Douglas Adams',
      isbn: '978-0345391803',
      publicationYear: 1979,
      genre: 'Science Fiction',
      description: 'A comedic science fiction series created by Douglas Adams.',
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0141439518',
      publicationYear: 1813,
      genre: 'Romance',
      description: 'A classic novel of manners.',
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0451524935',
      publicationYear: 1949,
      genre: 'Dystopian',
      description: 'A dystopian social science fiction novel and cautionary tale.',
    },
  ];

  for (const bookData of defaultBooks) {
    await prisma.book.upsert({
      where: { isbn: bookData.isbn },
      update: bookData,
      create: bookData,
    });
    console.log(`Book seeded: "${bookData.title}"`);
  }

  console.log('Database seeding complete.');
}

seedDatabase()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });