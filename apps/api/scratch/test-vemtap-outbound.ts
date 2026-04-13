import axios from 'axios';

/**
 * This script simulates outgoing requests from QR-Thrive to VemTap.
 * It uses the same configuration (URL, Header, Key) as the QR-Thrive backend.
 */

const VEMTAP_BASE_URL = 'http://localhost:3001/api/v1';
const VEMTAP_API_KEY = 'qr_thrive_internal_key_9a2b3c4d5e6f';

const headers = {
  'x-vemtap-api-key': VEMTAP_API_KEY,
  'Content-Type': 'application/json',
};

async function testVemtapOutbound() {
  console.log('--- Testing QR-Thrive -> VemTap Integration ---');

  // 1. Test Fetch Plans
  try {
    console.log(`\n[1/2] Testing GET ${VEMTAP_BASE_URL}/plans...`);
    const plansRes = await axios.get(`${VEMTAP_BASE_URL}/plans?onlyActive=true`, { headers });
    console.log('✅ Success! Received plans:', Array.isArray(plansRes.data) ? plansRes.data.length : 'Unknown format');
  } catch (error) {
    console.error('❌ Fetch Plans failed:', error.response?.status, error.response?.data || error.message);
  }

  // 2. Test User Provisioning
  try {
    console.log(`\n[2/2] Testing POST ${VEMTAP_BASE_URL}/users/provision...`);
    const provisionRes = await axios.post(
      `${VEMTAP_BASE_URL}/users/provision`,
      {
        email: 'test-integration@example.com',
        firstName: 'Integration',
        lastName: 'Test',
        planId: 'pro_plan_123' // Dummy plan ID
      },
      { headers }
    );
    console.log('✅ Success! Provisioning response:', provisionRes.status, provisionRes.data);
  } catch (error) {
    console.error('❌ User Provisioning failed:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n--- Test Complete ---');
}

testVemtapOutbound();
