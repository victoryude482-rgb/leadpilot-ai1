export interface PaymentVerificationInput { status: string; amount: number; expectedAmount: number; currency: string; expectedCurrency: string; }

export function verifyPayment(input: PaymentVerificationInput) {
  const successful = input.status === 'success';
  const amountMatches = input.amount === input.expectedAmount;
  const currencyMatches = input.currency === input.expectedCurrency;
  return { verified: successful && amountMatches && currencyMatches, successful, amountMatches, currencyMatches };
}
