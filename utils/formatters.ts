
export const formatCurrency = (amount: number, currency: string) => `${amount} ${currency}`;
export const formatDate = (date: number | string) => new Date(date).toLocaleDateString();
      