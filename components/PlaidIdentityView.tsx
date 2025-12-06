import React, { useState, useEffect } from 'react';
import {
  PlaidIdentityGetRequest,
  IdentityGetResponse,
  IdentityMatchRequest,
  IdentityMatchResponse,
  PlaidError,
  Account,
  Identity,
  IdentityMatch,
} from 'plaid';
import { usePlaid } from './PlaidContext';

const PlaidIdentityView: React.FC = () => {
  const { plaidClient } = usePlaid();
  const [identityData, setIdentityData] = useState<IdentityGetResponse | null>(null);
  const [identityMatchData, setIdentityMatchData] = useState<IdentityMatchResponse | null>(null);
  const [error, setError] = useState<PlaidError | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState<boolean>(false);
  const [loadingMatch, setLoadingMatch] = useState<boolean>(false);

  const [matchFormData, setMatchFormData] = useState<{
    name: string;
    email: string;
    address: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  }>({
    name: '',
    email: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
  });

  const accessToken = localStorage.getItem('plaidAccessToken'); // Assuming access token is stored

  useEffect(() => {
    const fetchIdentityData = async () => {
      if (!accessToken) {
        setError({
          error_type: 'INVALID_INPUT',
          error_code: 'ACCESS_TOKEN_INVALID',
          error_message: 'Access token not found.',
          display_message: 'Please link your account first.',
          status: 400,
          request_id: '',
        });
        return;
      }

      setLoadingIdentity(true);
      setError(null);
      try {
        const request: PlaidIdentityGetRequest = {
          access_token: accessToken,
        };
        const response = await plaidClient.identityGet(request);
        setIdentityData(response.data);
      } catch (err: any) {
        setError(err.response?.data || { error_message: 'An unknown error occurred.' });
      } finally {
        setLoadingIdentity(false);
      }
    };

    fetchIdentityData();
  }, [accessToken, plaidClient]);

  const handleMatchFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMatchFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIdentityMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError({
        error_type: 'INVALID_INPUT',
        error_code: 'ACCESS_TOKEN_INVALID',
        error_message: 'Access token not found.',
        display_message: 'Please link your account first.',
        status: 400,
        request_id: '',
      });
      return;
    }

    setLoadingMatch(true);
    setError(null);
    setIdentityMatchData(null);
    try {
      const request: IdentityMatchRequest = {
        access_token: accessToken,
        user: {
          name: matchFormData.name,
          email: matchFormData.email,
          address: {
            street: matchFormData.address,
            city: matchFormData.city,
            region: matchFormData.region,
            postal_code: matchFormData.postalCode,
            country: matchFormData.country,
          },
        },
      };
      const response = await plaidClient.identityMatch(request);
      setIdentityMatchData(response.data);
    } catch (err: any) {
      setError(err.response?.data || { error_message: 'An unknown error occurred.' });
    } finally {
      setLoadingMatch(false);
    }
  };

  return (
    <div>
      <h2>Identity Information</h2>
      {loadingIdentity && <p>Loading identity data...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.error_message}</p>}
      {identityData && (
        <div>
          {identityData.accounts.map((account: Account) => (
            <div key={account.account_id}>
              <h3>{account.name} ({account.official_name || 'N/A'})</h3>
              <p>Account ID: {account.account_id}</p>
              <p>Type: {account.type} / Subtype: {account.subtype}</p>
              {account.owners && account.owners.length > 0 && (
                <div>
                  <h4>Owners:</h4>
                  {account.owners.map((owner, ownerIndex) => (
                    <div key={ownerIndex}>
                      {owner.names && owner.names.length > 0 && (
                        <p>Name: {owner.names.join(', ')}</p>
                      )}
                      {owner.emails && owner.emails.length > 0 && (
                        <p>
                          Emails:{' '}
                          {owner.emails
                            .map((email) => email.data)
                            .join(', ')}
                        </p>
                      )}
                      {owner.addresses && owner.addresses.length > 0 && (
                        <div>
                          <h5>Addresses:</h5>
                          {owner.addresses.map((address, addrIndex) => (
                            <p key={addrIndex}>
                              {address.data.street},{' '}
                              {address.data.city},{' '}
                              {address.data.region} {address.data.postal_code},{' '}
                              {address.data.country}
                            </p>
                          ))}
                        </div>
                      )}
                      {owner.phone_numbers && owner.phone_numbers.length > 0 && (
                        <p>
                          Phone Numbers:{' '}
                          {owner.phone_numbers
                            .map((phone) => phone.data)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <hr />

      <h2>Identity Match Tool</h2>
      <form onSubmit={handleIdentityMatchSubmit}>
        <div>
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={matchFormData.name}
            onChange={handleMatchFormChange}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={matchFormData.email}
            onChange={handleMatchFormChange}
            required
          />
        </div>
        <div>
          <label htmlFor="address">Street Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={matchFormData.address}
            onChange={handleMatchFormChange}
            required
          />
        </div>
        <div>
          <label htmlFor="city">City:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={matchFormData.city}
            onChange={handleMatchFormChange}
            required
          />
        </div>
        <div>
          <label htmlFor="region">State/Region:</label>
          <input
            type="text"
            id="region"
            name="region"
            value={matchFormData.region}
            onChange={handleMatchFormChange}
            required
          />
        </div>
        <div>
          <label htmlFor="postalCode">Postal Code:</label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={matchFormData.postalCode}
            onChange={handleMatchFormChange}
            required
          />
        </div>
        <div>
          <label htmlFor="country">Country (e.g., US):</label>
          <input
            type="text"
            id="country"
            name="country"
            value={matchFormData.country}
            onChange={handleMatchFormChange}
            required
          />
        </div>
        <button type="submit" disabled={loadingMatch}>
          {loadingMatch ? 'Matching...' : 'Match Identity'}
        </button>
      </form>

      {loadingMatch && <p>Performing identity match...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.error_message}</p>}
      {identityMatchData && (
        <div>
          <h3>Identity Match Results:</h3>
          {identityMatchData.accounts.map((match: IdentityMatch, index) => (
            <div key={match.account_id || index}>
              <h4>Account: {identityData?.accounts.find(acc => acc.account_id === match.account_id)?.name || 'Unknown Account'}</h4>
              {match.legal_name && (
                <p>
                  Legal Name Match Score:{' '}
                  {match.legal_name.score} (Nickname Match:{' '}
                  {match.legal_name.is_nickname_match ? 'Yes' : 'No'}, Name Match:{' '}
                  {match.legal_name.is_first_name_or_last_name_match ? 'Yes' : 'No'})
                </p>
              )}
              {match.phone_number && <p>Phone Number Match Score: {match.phone_number.score}</p>}
              {match.email_address && <p>Email Address Match Score: {match.email_address.score}</p>}
              {match.address && <p>Address Match Score: {match.address.score} (Postal Code Match: {match.address.is_postal_code_match ? 'Yes' : 'No'})</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaidIdentityView;