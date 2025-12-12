import { AggregateRoot } from '@nestjs/cqrs';

export interface PartnerProps {
  name: string;
  description?: string;
  apiKey: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  logoUrl?: string;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  supportUrl?: string;
  metadata?: Record<string, any>; // For storing arbitrary data
}

export class Partner extends AggregateRoot {
  private readonly _id: string;
  private props: PartnerProps;

  constructor(id: string, props: PartnerProps) {
    super();
    this._id = id;
    this.props = {
      ...props,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
  }

  get id(): string {
    return this._id;
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

  get apiKey(): string {
    return this.props.apiKey;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(isActive: boolean) {
    this.props = { ...this.props, isActive, updatedAt: new Date() };
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get contactEmail(): string | undefined {
    return this.props.contactEmail;
  }

  set contactEmail(contactEmail: string | undefined) {
    this.props = { ...this.props, contactEmail, updatedAt: new Date() };
  }

  get contactPhone(): string | undefined {
    return this.props.contactPhone;
  }

  set contactPhone(contactPhone: string | undefined) {
    this.props = { ...this.props, contactPhone, updatedAt: new Date() };
  }

  get websiteUrl(): string | undefined {
    return this.props.websiteUrl;
  }

  set websiteUrl(websiteUrl: string | undefined) {
    this.props = { ...this.props, websiteUrl, updatedAt: new Date() };
  }

  get logoUrl(): string | undefined {
    return this.props.logoUrl;
  }

  set logoUrl(logoUrl: string | undefined) {
    this.props = { ...this.props, logoUrl, updatedAt: new Date() };
  }

  get termsOfServiceUrl(): string | undefined {
    return this.props.termsOfServiceUrl;
  }

  set termsOfServiceUrl(termsOfServiceUrl: string | undefined) {
    this.props = { ...this.props, termsOfServiceUrl, updatedAt: new Date() };
  }

  get privacyPolicyUrl(): string | undefined {
    return this.props.privacyPolicyUrl;
  }

  set privacyPolicyUrl(privacyPolicyUrl: string | undefined) {
    this.props = { ...this.props, privacyPolicyUrl, updatedAt: new Date() };
  }

    get supportEmail(): string | undefined {
        return this.props.supportEmail;
    }

    set supportEmail(supportEmail: string | undefined) {
        this.props = { ...this.props, supportEmail, updatedAt: new Date() };
    }

    get supportPhone(): string | undefined {
        return this.props.supportPhone;
    }

    set supportPhone(supportPhone: string | undefined) {
        this.props = { ...this.props, supportPhone, updatedAt: new Date() };
    }

    get supportUrl(): string | undefined {
        return this.props.supportUrl;
    }

    set supportUrl(supportUrl: string | undefined) {
        this.props = { ...this.props, supportUrl, updatedAt: new Date() };
    }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  set metadata(metadata: Record<string, any> | undefined) {
    this.props = { ...this.props, metadata, updatedAt: new Date() };
  }

  // Example method to activate the partner
  activate(): void {
    if (!this.isActive) {
      this.isActive = true;
      this.props = { ...this.props, isActive: true, updatedAt: new Date() };
      // Add domain event here if needed, e.g., this.apply(new PartnerActivatedEvent(this.id));
    }
  }

  // Example method to deactivate the partner
  deactivate(): void {
    if (this.isActive) {
      this.isActive = false;
      this.props = { ...this.props, isActive: false, updatedAt: new Date() };
      // Add domain event here if needed, e.g., this.apply(new PartnerDeactivatedEvent(this.id));
    }
  }

  getProps(): PartnerProps {
    return { ...this.props };
  }
}