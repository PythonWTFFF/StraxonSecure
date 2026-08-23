import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/straxon_v2?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create or get default organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Straxon Labs",
      },
    });
  }

  // Create admin user
  const passwordHash = await argon2.hash("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@straxon.com" },
    update: {
      passwordHash,
      role: "Admin",
      organizationId: org.id,
    },
    create: {
      email: "admin@straxon.com",
      name: "System Admin",
      passwordHash,
      role: "Admin",
      organizationId: org.id,
    },
  });

  console.log("Database seeded successfully.");
  console.log(`Admin User: ${admin.email} / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
