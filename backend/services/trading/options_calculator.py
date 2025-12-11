```python
import math
from scipy.stats import norm

class OptionsCalculator:
    """
    A class for calculating option prices and greeks using various models.
    """

    @staticmethod
    def black_scholes(option_type, S, K, T, r, sigma, q=0.0):
        """
        Calculates the Black-Scholes option price and Greeks.

        Args:
            option_type (str): 'call' or 'put'
            S (float): Current stock price
            K (float): Option strike price
            T (float): Time to expiration in years
            r (float): Risk-free interest rate
            sigma (float): Volatility of the stock
            q (float): Dividend yield (default: 0.0)

        Returns:
            dict: A dictionary containing the option price and Greeks:
                  {'price': option_price, 'delta': delta, 'gamma': gamma,
                   'vega': vega, 'theta': theta, 'rho': rho}
                  Returns None if any input is invalid.
        """

        try:
            S = float(S)
            K = float(K)
            T = float(T)
            r = float(r)
            sigma = float(sigma)
            q = float(q)

            if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
                return None

            d1 = (math.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
            d2 = d1 - sigma * math.sqrt(T)

            if option_type.lower() == 'call':
                price = S * math.exp(-q * T) * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
                delta = math.exp(-q * T) * norm.cdf(d1)
                gamma = math.exp(-q * T) * norm.pdf(d1) / (S * sigma * math.sqrt(T))
                vega = S * math.exp(-q * T) * norm.pdf(d1) * math.sqrt(T)
                theta = -S * math.exp(-q * T) * norm.pdf(d1) * sigma / (2 * math.sqrt(T)) - r * K * math.exp(-r * T) * norm.cdf(d2) + q * S * math.exp(-q * T) * norm.cdf(d1)
                rho = K * T * math.exp(-r * T) * norm.cdf(d2)
            elif option_type.lower() == 'put':
                price = K * math.exp(-r * T) * norm.cdf(-d2) - S * math.exp(-q * T) * norm.cdf(-d1)
                delta = -math.exp(-q * T) * norm.cdf(-d1)
                gamma = math.exp(-q * T) * norm.pdf(d1) / (S * sigma * math.sqrt(T))
                vega = S * math.exp(-q * T) * norm.pdf(d1) * math.sqrt(T)
                theta = -S * math.exp(-q * T) * norm.pdf(d1) * sigma / (2 * math.sqrt(T)) + r * K * math.exp(-r * T) * norm.cdf(-d2) - q * S * math.exp(-q * T) * norm.cdf(-d1)
                rho = -K * T * math.exp(-r * T) * norm.cdf(-d2)
            else:
                return None  # Invalid option type

            return {
                'price': price,
                'delta': delta,
                'gamma': gamma,
                'vega': vega,
                'theta': theta,
                'rho': rho
            }

        except (ValueError, OverflowError):
            return None  # Handle potential errors

    # Add other option pricing models here (e.g., Binomial Tree)
    # For example, a simple Binomial Tree model:

    @staticmethod
    def binomial_tree(option_type, S, K, T, r, sigma, n):
      """
      Calculates the option price using the Binomial Tree model.

      Args:
          option_type (str): 'call' or 'put'
          S (float): Current stock price
          K (float): Option strike price
          T (float): Time to expiration in years
          r (float): Risk-free interest rate
          sigma (float): Volatility of the stock
          n (int): Number of time steps

      Returns:
          float: The calculated option price.
          Returns None if any input is invalid.
      """
      try:
        S = float(S)
        K = float(K)
        T = float(T)
        r = float(r)
        sigma = float(sigma)
        n = int(n)

        if S <= 0 or K <= 0 or T <= 0 or sigma <= 0 or n <= 0:
            return None

        dt = T / n
        u = math.exp(sigma * math.sqrt(dt))
        d = 1 / u
        p = (math.exp(r * dt) - d) / (u - d)

        # Initialize option values at expiration
        option_values = [0.0] * (n + 1)
        for i in range(n + 1):
          stock_price = S * (u ** (n - i)) * (d ** i)
          if option_type.lower() == 'call':
            option_values[i] = max(0, stock_price - K)
          elif option_type.lower() == 'put':
            option_values[i] = max(0, K - stock_price)
          else:
            return None

        # Step backward through the tree
        for j in range(n - 1, -1, -1):
          for i in range(j + 1):
            option_values[i] = math.exp(-r * dt) * (p * option_values[i] + (1 - p) * option_values[i + 1])

        return option_values[0]
      except (ValueError, OverflowError):
          return None
```