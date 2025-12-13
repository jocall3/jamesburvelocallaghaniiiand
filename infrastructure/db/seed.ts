import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a default admin user
  const hashedPassword = await hash('Admin123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(), // Simulate email verification
    },
  });

  console.log('Admin user created/updated:', adminUser);

  // Create default subscription plans
  const freePlan = await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      price: 0,
      features: ['Basic features', 'Limited support'],
      interval: 'month',
    },
  });

  const basicPlan = await prisma.plan.upsert({
    where: { name: 'Basic' },
    update: {},
    create: {
      name: 'Basic',
      price: 10,
      features: ['All free features', 'Priority support', 'Additional storage'],
      interval: 'month',
    },
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { name: 'Premium' },
    update: {},
    create: {
      name: 'Premium',
      price: 25,
      features: ['All basic features', '24/7 support', 'Unlimited storage', 'Advanced analytics'],
      interval: 'month',
    },
  });

  console.log('Default plans created/updated:', { freePlan, basicPlan, premiumPlan });

  // Create a sample tenant (application)
  const sampleTenant = await prisma.tenant.upsert({
    where: { slug: 'sample-app' },
    update: {},
    create: {
      name: 'Sample Application',
      slug: 'sample-app',
      description: 'A sample application for demonstration purposes.',
      planId: basicPlan.id, // Assign the basic plan to the sample tenant
      ownerId: adminUser.id, // Assign the admin user as the owner
    },
  });

  console.log('Sample tenant created/updated:', sampleTenant);

  // Create a second sample tenant (application)
  const anotherSampleTenant = await prisma.tenant.upsert({
    where: { slug: 'another-app' },
    update: {},
    create: {
      name: 'Another Application',
      slug: 'another-app',
      description: 'Another sample application for demonstration purposes.',
      planId: premiumPlan.id, // Assign the premium plan to the sample tenant
      ownerId: adminUser.id, // Assign the admin user as the owner
    },
  });

  console.log('Another sample tenant created/updated:', anotherSampleTenant);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });