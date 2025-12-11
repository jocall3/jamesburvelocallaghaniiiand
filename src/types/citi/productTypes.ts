/**
 * The status of the account. Currently this API returns ACTIVE
 * products only.
 */
export type AccountStatus = "ACTIVE";

/**
 * Account Type is a classification of accounts according to their
 * common characteristics
 */
export type AccountType = "CHECKING" | "SAVINGS" | "CREDIT_CARD";

/**
 * Represents a single product/account held by a Citi customer.
 */
export interface Product {
  /**
   * Long-term persistent identity of the account. Not an account number.
   * @example "8035a60debb671e89bd451c9ad0f283e8f1b8868dd4dc65520ceb7bdfeb4142999f574c9db37917ef0edfae296745142543e3ad2bc034887f37212ecbde83ee0"
   */
  accountId: string;

  /**
   * The status of the account.
   */
  status: AccountStatus;

  /**
   * Citi’s product name.
   * @example "Citi Rewards+℠ Card"
   */
  productName: string;

  /**
   * The type of the account.
   */
  accountType: AccountType;

  /**
   * A masked account number that can be displayed to the end customer
   * to identify the account. Note - It displays only the last 4 digits of
   * the account number, with the remaining numbers masked as "X".
   * @example "XXXXXXXXXXXX7899"
   */
  accountNumberDisplay: string;
}
