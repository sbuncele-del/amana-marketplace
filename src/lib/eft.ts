import 'server-only';

export function eftBankDetails() {
  const accountNumber = process.env.PLENTOVO_EFT_ACCOUNT_NUMBER?.trim();
  const branchCode = process.env.PLENTOVO_EFT_BRANCH_CODE?.trim();
  if (!accountNumber || !/^\d{6,16}$/.test(accountNumber) || !branchCode || !/^\d{6}$/.test(branchCode)) return null;
  return { bank: 'Standard Bank', holder: 'MASAPHOKATI GLOBAL SHELF (PTY) LTD', type: 'Current', accountNumber, branchCode };
}
