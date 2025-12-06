
import React, { useContext, createContext } from 'react';
const Context = createContext({ data: { charge: [] } });
export const useStripeNexus = () => useContext(Context);
      