
import React, { useState, useEffect, useCallback } from 'react';
import {
  useMoneyMovement,
} from './MoneyMovementContext';
import {
  RetrieveUnmaskedAccountDataRequest,
  RetrieveUnmaskedAccountDataResponse,
  ErrorResponse
} from './CitibankMoneyMovementSDK';

interface CitibankUnmaskedDataViewProps {
  accountIdsToUnmask: string[];
  onClose?: () => void;
}

const SECURE_PASSWORD = 'mySecurePassword123!'; 

const CitibankUnmaskedDataView: React.FC<CitibankUnmaskedDataViewProps> = ({ accountIdsToUnmask, onClose }) => {
  const { api, accessToken, uuid, generateNewUuid } = useMoneyMovement();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [unmaskedData, setUnmaskedData] = useState<RetrieveUnmaskedAccountDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = useCallback(() => {
    if (passwordInput === SECURE_PASSWORD) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Authentication failed.');
      setIsAuthenticated(false);
    }
    setPasswordInput('');
  }, [passwordInput]);

  const fetchUnmaskedAccountData = useCallback(async () => {
    if (!api || !accessToken || !isAuthenticated || accountIdsToUnmask.length === 0) return;

    setIsLoading(true);
    setError(null);
    setUnmaskedData(null);

    try {
      const requestBody: RetrieveUnmaskedAccountDataRequest = {
        accountInfo: accountIdsToUnmask.map(id => ({ accountId: id })),
      };
      generateNewUuid(); 
      // Mock response for now as SDK might not implement this specific method yet
      // const response = await api.retrieveUnmaskedAccountData(accessToken, uuid, requestBody);
      // setUnmaskedData(response);
      setTimeout(() => {
          setUnmaskedData({ accounts: accountIdsToUnmask.map(id => ({ accountId: id, unmaskedAccountNumber: '1234567890' })) });
          setIsLoading(false);
      }, 1000);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [api, accessToken, uuid, generateNewUuid, isAuthenticated, accountIdsToUnmask]);

  useEffect(() => {
    if (isAuthenticated && accountIdsToUnmask.length > 0) {
      fetchUnmaskedAccountData();
    }
  }, [isAuthenticated, accountIdsToUnmask, fetchUnmaskedAccountData]);

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-gray-800 text-white rounded">
        <h3>Re-authenticate to view sensitive data</h3>
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          className="p-2 text-black rounded mr-2"
        />
        <button onClick={handleAuthenticate} className="p-2 bg-blue-600 rounded">Authenticate</button>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded">
      <h3>Unmasked Account Numbers</h3>
      {isLoading && <p>Loading...</p>}
      {unmaskedData?.accounts?.map((acc) => (
          <div key={acc.accountId} className="flex justify-between border-b border-gray-700 p-2">
              <span>{acc.accountId}</span>
              <span className="font-mono text-yellow-400">{acc.unmaskedAccountNumber}</span>
          </div>
      ))}
      {onClose && <button onClick={onClose} className="mt-4 p-2 bg-gray-600 rounded">Close</button>}
    </div>
  );
};

export default CitibankUnmaskedDataView;
