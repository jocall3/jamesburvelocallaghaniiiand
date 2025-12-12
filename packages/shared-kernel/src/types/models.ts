export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role: UserRole;
  tenantId?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

export interface Account {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  plan: AccountPlan;
  tenantId?: string;
}

export enum AccountPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  settings?: TenantSettings;
}

export interface TenantSettings {
  theme?: 'light' | 'dark';
  language?: string;
  customizations?: Record<string, any>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  tenantId?: string;
}

export interface Order {
  id: string;
  customerId: string;
  orderDate: Date;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  tenantId?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  timestamp: Date;
  action: string;
  resource: string;
  details: Record<string, any>;
  tenantId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  timestamp: Date;
  message: string;
  isRead: boolean;
  type: NotificationType;
  data?: Record<string, any>;
  tenantId?: string;
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    dueDate?: Date;
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId?: string;
}

export enum TaskStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    BLOCKED = 'BLOCKED',
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    status: ProjectStatus;
    teamMembers: string[]; // User IDs
    createdAt: Date;
    updatedAt: Date;
    tenantId?: string;
}

export enum ProjectStatus {
    PLANNED = 'PLANNED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    ON_HOLD = 'ON_HOLD',
    CANCELLED = 'CANCELLED',
}