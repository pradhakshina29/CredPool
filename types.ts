
export enum UserRole {
  BORROWER = 'BORROWER',
  LENDER = 'LENDER',
  ADMIN = 'ADMIN',
  UNASSIGNED = 'UNASSIGNED'
}

export interface User {
  id: string;
  udyamId: string;
  phoneNumber: string;
  email?: string;
  name: string;
  role: UserRole;
  walletAddress?: string;
  isVerified: boolean;
}

export interface BusinessProfile {
  name: string;
  industry: 'Manufacturing' | 'Retail' | 'Services';
  yearsInOperation: number;
  annualRevenue: number;
  monthlyAvgRevenue: number;
  gstRegistered: boolean;
  employeeCount: number;
}

export interface FinancialSignals {
  sixMonthRevenue: number[];
  avgMonthlyExpenses: number;
  outstandingLiabilities: number;
  existingLoans: boolean;
  invoiceVolume: number;
  avgPaymentDelay: number;
}

export interface LoanApplication {
  amount: number;
  purpose: 'Working Capital' | 'Inventory' | 'Expansion';
  tenure: 6 | 12 | 18;
  interestRange: [number, number];
}

export interface CreditAssessment {
  score: number;
  defaultProbability: number;
  riskCategory: 'Low' | 'Medium' | 'High';
  suggestedInterestRate: number;
  eligiblePoolSize: number;
  reasoning: string;
}

export interface LenderPreferences {
  experience: 'Beginner' | 'Intermediate' | 'Expert';
  riskAppetite: 'Conservative' | 'Balanced' | 'Aggressive';
  availableCapital: number;
  annualRevenue: number; // New: for lending capacity calculation
  maxTicketSize: number;
  preferredTenure: number;
  expectedReturn: number;
  preferredIndustries: string[];
}

export interface PoolCommitment {
  lenderId: string;
  lenderName: string;
  amount: number;
  repaymentDuration: number; // Custom duration set by lender
  timestamp: number;
  status: 'PENDING' | 'ACCEPTED' | 'REPAYING' | 'COMPLETED';
}

export interface PoolEntry {
  id: string;
  borrowerId: string;
  borrowerName: string;
  profile: BusinessProfile;
  finance: FinancialSignals;
  loan: LoanApplication;
  assessment: CreditAssessment;
  totalFunded: number;
  totalRepaid: number;
  status: 'OPEN' | 'FUNDED' | 'ACTIVE' | 'REPAID' | 'CLOSED';
  createdAt: number;
  commitments: PoolCommitment[]; // track individual lender contributions
}

export interface Repayment {
  id: string;
  poolId: string;
  borrowerId: string;
  amount: number;
  dueDate: number;
  status: 'SCHEDULED' | 'PAID' | 'LATE';
  paidAt?: number;
}
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  timestamp: number;
  read: boolean;
}

export interface PersistedBorrowerData {
  profile: BusinessProfile;
  finance: FinancialSignals;
  loan: LoanApplication;
  assessment?: CreditAssessment;
  lastUpdated: number;
  creditScore?: number; // Dynamic score based on history
}

export interface PersistedLenderData {
  preferences: LenderPreferences;
  walletAddress?: string;
  myPledges: { poolId: string, amount: number, timestamp: number }[];
  lastUpdated: number;
}

export interface AllocationSuggestion {
  suggestedAmount: number;
  maxLendingCapacity: number; // New capacity based on revenue
  confidenceScore: number;
  allocationReason: string;
}

export interface Transaction {
  id?: string;
  userId: string;
  userEmail: string;
  amount: number;
  loanId: string;
  orderId: string;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  timestamp: any; // Using any for serverTimestamp
  paymentMethod: "PayPal";
}

export interface SandboxAccount {
  id?: string;
  email: string;
  password: string;
  userId: string;
  name: string;
  status: "ACTIVE" | "BLOCKED";
  balance: number;
  createdAt: any;
}