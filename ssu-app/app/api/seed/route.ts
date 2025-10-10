import bcrypt from "bcrypt";
import postgres from "postgres";
import { NextResponse } from "next/server";
import { invoices, customers, revenue, users } from "../../lib/placeholder-data";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function seedUsers(db: postgres.Sql) {
  await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );
}

async function seedCustomers(db: postgres.Sql) {
  await db`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  await Promise.all(
    customers.map(
      (customer) => db`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );
}

async function seedInvoices(db: postgres.Sql) {
  await db`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  await Promise.all(
    invoices.map(
      (invoice) => db`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT DO NOTHING;
      `
    )
  );
}

async function seedRevenue(db: postgres.Sql) {
  await db`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  await Promise.all(
    revenue.map(
      (rev) => db`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `
    )
  );
}

export async function GET() {
  try {
    await sql.begin(async (tx) => {
      await seedUsers(tx);
      await seedCustomers(tx);
      await seedInvoices(tx);
      await seedRevenue(tx);
    });

    return NextResponse.json({ message: "Database seeded successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
