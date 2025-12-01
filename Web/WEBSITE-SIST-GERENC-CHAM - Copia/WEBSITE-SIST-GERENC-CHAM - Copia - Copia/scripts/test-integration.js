#!/usr/bin/env node
/**
 * Simple integration test for frontend + backend
 */

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

async function test(name, fn) {
  try {
    console.log(`\n✓ Testing: ${name}`);
    await fn();
    console.log(`  ✓ ${name} passed`);
  } catch (error) {
    console.error(`  ✗ ${name} failed: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  console.log(`\n🚀 Integration Tests (API_URL=${API_URL})`);

  // Test 1: Backend is responding
  await test('Backend is listening', async () => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'admin', senha: 'admin123' }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.id) throw new Error('No user ID in response');
    console.log(`    Response: ${JSON.stringify(data)}`);
  });

  // Test 2: Get all tickets
  await test('GET /api/chamados works', async () => {
    const res = await fetch(`${API_URL}/api/chamados`, {
      method: 'GET',
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    console.log(`    Found ${Array.isArray(data) ? data.length : 0} tickets`);
  });

  // Test 3: Get all users
  await test('GET /api/usuarios works', async () => {
    const res = await fetch(`${API_URL}/api/usuarios`, {
      method: 'GET',
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    console.log(`    Found ${Array.isArray(data) ? data.length : 0} users`);
  });

  console.log(`\n✅ All integration tests passed!\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
