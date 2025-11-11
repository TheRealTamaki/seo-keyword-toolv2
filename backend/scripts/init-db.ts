#!/usr/bin/env ts-node

/**
 * Database initialization script
 *
 * This script:
 * 1. Connects to PostgreSQL
 * 2. Runs the schema.sql file to create all tables
 * 3. Optionally runs seed data
 *
 * Usage:
 *   npm run db:init
 *   npm run db:init -- --seed  (with seed data)
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'seo_keyword_tool',
});

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...\n');

  try {
    // Test connection
    console.log('1. Testing database connection...');
    const result = await pool.query('SELECT NOW(), version()');
    console.log(`   ✓ Connected to database`);
    console.log(`   ✓ Server time: ${result.rows[0].now}`);
    console.log(`   ✓ PostgreSQL version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}\n`);

    // Read schema file
    console.log('2. Reading schema file...');
    const schemaPath = path.join(__dirname, '../../database/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log(`   ✓ Schema file loaded (${schema.length} bytes)\n`);

    // Execute schema
    console.log('3. Executing schema...');
    await pool.query(schema);
    console.log('   ✓ Schema executed successfully\n');

    // Verify tables
    console.log('4. Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`   ✓ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`     - ${row.table_name}`);
    });
    console.log('');

    // Check for seed data flag
    const shouldSeed = process.argv.includes('--seed');
    if (shouldSeed) {
      console.log('5. Running seed data...');
      await runSeedData();
      console.log('   ✓ Seed data inserted\n');
    }

    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function runSeedData() {
  const seedPath = path.join(__dirname, '../../database/seeds/sample-data.sql');

  if (fs.existsSync(seedPath)) {
    const seedData = fs.readFileSync(seedPath, 'utf-8');
    await pool.query(seedData);
  } else {
    console.log('   ⚠ No seed data file found, skipping...');
  }
}

// Run if executed directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
