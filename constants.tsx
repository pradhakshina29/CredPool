
/**
 * HACKATHON CONFIGURATION & ARCHITECTURE
 * 
 * 1. FIXED DEMO INPUTS:
 * - UDYAM-PB-20-0001234 → +91-9000000001
 * - UDYAM-KA-19-0005678 → +91-9000000002
 * - UDYAM-MH-21-0009012 → +91-9000000003
 * 
 * 2. OTP LOGIC:
 * - 6-Digit random generation
 * - 2-minute expiry (120 seconds)
 * - 3 attempts max before reset
 * 
 * 3. BACKEND (PROPOSED NODE.JS/POSTGRES):
 * - POST /auth/request-otp: 
 *      Body: { udyamId, phone }
 *      Logic: Validate against MSME directory -> Generate OTP -> Store in Redis (EX 120) -> Log to console.
 * - POST /auth/verify-otp:
 *      Body: { udyamId, code }
 *      Logic: Compare with Redis -> If match, create JWT session.
 * 
 * 4. SECURITY BEST PRACTICES:
 * - Never store raw UDYAM IDs; use salted SHA-256.
 * - Implement Rate Limiting on /request-otp via Redis.
 */

export const MOCK_MSME_DATA = [
  { udyam: "UDYAM-PB-20-0001234", phone: "+91-9000000001", name: "Punjab Fabrics Ltd" },
  { udyam: "UDYAM-KA-19-0005678", phone: "+91-9000000002", name: "Karnataka Tech Solutions" },
  { udyam: "UDYAM-MH-21-0009012", phone: "+91-9000000003", name: "Maharashtra Agri-Hub" }
];

export const OTP_EXPIRY_SECONDS = 120;
export const MAX_OTP_ATTEMPTS = 3;
