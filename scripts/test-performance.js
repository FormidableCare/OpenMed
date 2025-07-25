#!/usr/bin/env node

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";

async function testPerformance() {
  console.log("🚀 Testing OpenMed Performance...\n");

  // Test 1: Initial load (should be slow)
  console.log("1. Testing initial load...");
  const start1 = Date.now();
  try {
    const response1 = await fetch(`${BASE_URL}/api/medications`);
    const data1 = await response1.json();
    const time1 = Date.now() - start1;
    console.log(`   ✅ Loaded ${data1.length} medications in ${time1}ms`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Cached load (should be fast)
  console.log("\n2. Testing cached load...");
  const start2 = Date.now();
  try {
    const response2 = await fetch(`${BASE_URL}/api/medications`);
    const data2 = await response2.json();
    const time2 = Date.now() - start2;
    console.log(`   ✅ Loaded ${data2.length} medications in ${time2}ms`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Individual medication load
  console.log("\n3. Testing individual medication load...");
  const start3 = Date.now();
  try {
    const response3 = await fetch(`${BASE_URL}/api/medications/10`);
    const data3 = await response3.json();
    const time3 = Date.now() - start3;
    console.log(`   ✅ Loaded medication ${data3.id} in ${time3}ms`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Cache status
  console.log("\n4. Testing cache status...");
  try {
    const response4 = await fetch(`${BASE_URL}/api/cache`);
    const data4 = await response4.json();
    console.log(`   ✅ Cache status:`, data4.status);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log("\n🎯 Performance Test Complete!");
}

// Run the test
testPerformance().catch(console.error);
