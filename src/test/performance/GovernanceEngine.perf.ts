import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import crypto from 'k6/crypto';

export const options: Options = {
  scenarios: {
    governance_decision_throughput: {
      executor: 'ramping-arrival-rate',
      startRate: 20,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 1000,
      stages: [
        { target: 100, duration: '2m' }, // Ramp up to 100 decisions/sec
        { target: 500, duration: '5m' }, // Scale to high throughput for decision engine
        { target: 500, duration: '2m' }, // Sustain peak load
        { target: 0, duration: '1m' },   // Cooldown
      ],
    },
  },
  thresholds: {
    // Governance engine must render decisions quickly under load
    http_req_duration: ['p(95)<400', 'p(99)<800'], 
    // High reliability required for eligibility checks
    http_req_failed: ['rate<0.005'], 
  },
};

const BASE_URL = 'https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers';

export default function () {
  const reqUuid = crypto.randomUUID();

  // Headers defined in the OpenAPI spec for the Eligibility API
  const params = {
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.performance_test_token',
      'uuid': reqUuid,
      'Accept': 'application/json',
      'client_id': 'governance-perf-test-client',
      'clientDetails': 'devicePrint=perf-harness;userIpAddress=192.168.1.1;userAgent=k6',
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'BalanceTransferEligibility',
    },
  };

  // Test parameter to trigger specific governance rules for READY_CREDIT
  const queryString = '?btSupportedAccountGroup=READY_CREDIT';

  const response = http.get(`${BASE_URL}${queryString}`, params);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'decision payload present': (r) => {
      try {
        const body = r.json() as any;
        return body && Array.isArray(body.balanceTransferEligibilityDetails);
      } catch (e) {
        return false;
      }
    },
    'max loan amount calculated': (r) => {
      try {
        const body = r.json() as any;
        return body.balanceTransferEligibilityDetails[0].maximumEligibleLoanAmount !== undefined;
      } catch (e) {
        return false;
      }
    }
  });

  // Short sleep to simulate very fast user/system reaction time
  sleep(0.1);
}