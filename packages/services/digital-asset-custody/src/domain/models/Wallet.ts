import { v4 as uuidv4 } from 'uuid';

export interface WalletProps {
  id: string;
  userId: string;
  name: string;
  description?: string;
  currency: string; // e.g., 'BTC', 'ETH', 'USD'
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  address?: string; // Optional: Cryptocurrency address
  publicKey?: string; // Optional: Public Key for the wallet
  privateKey?: string; // Optional: Private Key (handle with extreme care!)
  network?: string; // Optional: Network (e.g., 'mainnet', 'testnet')
  tags?: string[]; // Optional: Tags for categorization
  metadata?: Record<string, any>; // Optional: Store arbitrary metadata
}

export class Wallet {
  private props: WalletProps;

  constructor(props: Omit<WalletProps, 'id' | 'createdAt' | 'updatedAt'>, id?: string) {
    this.props = {
      id: id || uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false, // Default value
      ...props,
    };
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  set userId(userId: string) {
    this.props = { ...this.props, userId, updatedAt: new Date() };
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props = { ...this.props, name, updatedAt: new Date() };
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(description: string | undefined) {
    this.props = { ...this.props, description, updatedAt: new Date() };
  }

  get currency(): string {
    return this.props.currency;
  }

  set currency(currency: string) {
    this.props = { ...this.props, currency, updatedAt: new Date() };
  }

  get balance(): number {
    return this.props.balance;
  }

  set balance(balance: number) {
    this.props = { ...this.props, balance, updatedAt: new Date() };
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  set isArchived(isArchived: boolean) {
    this.props = { ...this.props, isArchived, updatedAt: new Date() };
  }

  get address(): string | undefined {
    return this.props.address;
  }

  set address(address: string | undefined) {
    this.props = { ...this.props, address, updatedAt: new Date() };
  }

  get publicKey(): string | undefined {
    return this.props.publicKey;
  }

  set publicKey(publicKey: string | undefined) {
    this.props = { ...this.props, publicKey, updatedAt: new Date() };
  }

  get privateKey(): string | undefined {
    return this.props.privateKey;
  }

  set privateKey(privateKey: string | undefined) {
    this.props = { ...this.props, privateKey, updatedAt: new Date() };
  }

  get network(): string | undefined {
    return this.props.network;
  }

  set network(network: string | undefined) {
    this.props = { ...this.props, network, updatedAt: new Date() };
  }

  get tags(): string[] | undefined {
    return this.props.tags;
  }

  set tags(tags: string[] | undefined) {
    this.props = { ...this.props, tags, updatedAt: new Date() };
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  set metadata(metadata: Record<string, any> | undefined) {
    this.props = { ...this.props, metadata, updatedAt: new Date() };
  }

  public toJSON(): WalletProps {
    return { ...this.props };
  }

  public update(props: Partial<Omit<WalletProps, 'id' | 'createdAt' | 'updatedAt'>>) {
    this.props = { ...this.props, ...props, updatedAt: new Date() };
  }
}