/**
 * Simple delay utility for simulating processing time
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
