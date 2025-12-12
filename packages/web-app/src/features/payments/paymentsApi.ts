import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/payments', // Adjust if needed, e.g., process.env.PAYMENTS_API_URL
    prepareHeaders: (headers, { getState }) => {
      // Add authentication token if available
      const token = (getState() as any)?.auth?.token; // Adjust based on your state structure
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<{ clientSecret: string }, { amount: number; currency: string }>({
      query: (body) => ({
        url: '/create-payment-intent',
        method: 'POST',
        body,
      }),
    }),
    verifyPayment: builder.mutation<
      { success: boolean; message?: string },
      { paymentIntentId: string; expectedAmount: number }
    >({
      query: (body) => ({
        url: '/verify-payment',
        method: 'POST',
        body,
      }),
    }),
    getPaymentMethods: builder.query<any[], void>({
      query: () => '/payment-methods',
    }),
    addPaymentMethod: builder.mutation<any, any>({
      query: (paymentMethod) => ({
        url: '/payment-methods',
        method: 'POST',
        body: paymentMethod,
      }),
    }),
    deletePaymentMethod: builder.mutation<any, string>({
      query: (paymentMethodId) => ({
        url: `/payment-methods/${paymentMethodId}`,
        method: 'DELETE',
      }),
    }),
    processSubscriptionPayment: builder.mutation<any, { subscriptionId: string }>({
      query: (body) => ({
        url: '/process-subscription-payment',
        method: 'POST',
        body,
      }),
    }),
    getPaymentHistory: builder.query<any[], { userId: string; limit?: number; offset?: number } | void>({
      query: (params) => {
        let url = '/payment-history';
        if (params) {
          const queryParams = new URLSearchParams();
          if (params.userId) {
            queryParams.append('userId', params.userId);
          }
          if (params.limit) {
            queryParams.append('limit', params.limit.toString());
          }
          if (params.offset) {
            queryParams.append('offset', params.offset.toString());
          }
          url += `?${queryParams.toString()}`;
        }
        return url;
      },
    }),
    refundPayment: builder.mutation<any, { paymentId: string; amount: number; reason: string }>({
      query: (body) => ({
        url: '/refund-payment',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useVerifyPaymentMutation,
  useGetPaymentMethodsQuery,
  useAddPaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useProcessSubscriptionPaymentMutation,
  useGetPaymentHistoryQuery,
  useRefundPaymentMutation,
} = paymentsApi;

export default paymentsApi;