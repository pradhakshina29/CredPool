
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile, FinancialSignals, LoanApplication, CreditAssessment, LenderPreferences, AllocationSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY });

export const analyzeMSMEProtocol = async (
  profile: BusinessProfile,
  finance: FinancialSignals,
  loan: LoanApplication
): Promise<CreditAssessment> => {
  const prompt = `Act as an Indian MSME Credit Underwriter. Analyze this data for a Pooling-based loan:
  
  BUSINESS: ${profile.name}, Industry: ${profile.industry}, Years: ${profile.yearsInOperation}, GST: ${profile.gstRegistered ? 'Yes' : 'No'}, Employees: ${profile.employeeCount}
  REVENUE (Last 6 Months): ₹${finance.sixMonthRevenue.join(', ₹')}
  AVG EXPENSES: ₹${finance.avgMonthlyExpenses}
  LIABILITIES: ₹${finance.outstandingLiabilities}
  INVOICE VOL: ${finance.invoiceVolume}/mo, PAYMENT DELAY: ${finance.avgPaymentDelay} days
  REQUESTED LOAN: ₹${loan.amount} for ${loan.purpose} over ${loan.tenure} months.

  Output a risk assessment including score (0-100), default probability, category, rate, eligible pool size, and reasoning.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            defaultProbability: { type: Type.NUMBER },
            riskCategory: { type: Type.STRING },
            suggestedInterestRate: { type: Type.NUMBER },
            eligiblePoolSize: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["score", "defaultProbability", "riskCategory", "suggestedInterestRate", "eligiblePoolSize", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      score: 60,
      defaultProbability: 0.15,
      riskCategory: 'Medium',
      suggestedInterestRate: 14.5,
      eligiblePoolSize: loan.amount * 0.8,
      reasoning: "Baseline assessment generated due to AI connectivity timeout."
    };
  }
};

export const calculateLenderAllocation = async (
  pool: { assessment: CreditAssessment, loan: LoanApplication, profile: BusinessProfile },
  lender: LenderPreferences
): Promise<AllocationSuggestion> => {
  const prompt = `Act as an AI Portfolio Allocator for a Lending Platform.
  
  LENDER STRATEGY: 
  - Max Ticket: ₹${lender.maxTicketSize}
  - Risk Appetite: ${lender.riskAppetite}
  - Preferred Industries: ${lender.preferredIndustries.join(', ')}

  BORROWER POOL:
  - Industry: ${pool.profile.industry}
  - Risk Category: ${pool.assessment.riskCategory}
  - Merit Score: ${pool.assessment.score}/100
  - Target Yield: ${pool.assessment.suggestedInterestRate}%
  - Total Loan Needed: ₹${pool.loan.amount}

  Calculate exactly how much this specific lender should invest (between 0 and their max ticket size).
  Also calculate their "Max Lending Capacity" which should be roughly 20% of their annual revenue (₹${lender.annualRevenue}).
  Ensure the amount respects the risk appetite (e.g., Conservative should invest less in High risk).
  Explain the reasoning based on the match between Lender strategy and Borrower cashflow profile.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedAmount: { type: Type.NUMBER },
            maxLendingCapacity: { type: Type.NUMBER },
            confidenceScore: { type: Type.NUMBER },
            allocationReason: { type: Type.STRING }
          },
          required: ["suggestedAmount", "maxLendingCapacity", "confidenceScore", "allocationReason"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    return {
      suggestedAmount: Math.min(lender.maxTicketSize * 0.25, pool.loan.amount * 0.1),
      maxLendingCapacity: lender.annualRevenue * 0.2,
      confidenceScore: 0.5,
      allocationReason: "Standard allocation applied due to AI processing delay."
    };
  }
};

export const calculateDynamicCreditScore = async (
  baseScore: number,
  repayments: { status: string, amount: number }[]
): Promise<number> => {
  const prompt = `Act as an AI Credit Scoring Engine.
  
  BASE MERIT SCORE: ${baseScore}
  REPAYMENT HISTORY: ${JSON.stringify(repayments)}

  Calculate an updated credit score (0-1000 scale, but keep it in 0-100 for this MVP UI simplicity if needed). 
  Reward on-time payments and penalize late ones.
  Return only the new numerical score.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newScore: { type: Type.NUMBER }
          },
          required: ["newScore"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result.newScore || baseScore;
  } catch (error) {
    // Simple fallback logic
    let score = baseScore;
    repayments.forEach(r => {
      if (r.status === 'PAID') score += 2;
      if (r.status === 'LATE') score -= 5;
    });
    return Math.min(100, Math.max(0, score));
  }
};
