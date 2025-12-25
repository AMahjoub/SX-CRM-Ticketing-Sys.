
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CLIENT = 'CLIENT'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface CrudPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface AuditLog {
  user_name: string;
  user_email: string;
  action_datetime: string;
  before_change: any;
  after_change: any;
}

export interface EmailSettings {
  provider: 'SMTP' | 'SENDGRID' | 'MAILGUN' | 'SES';
  host: string;
  port: number;
  encryption: 'NONE' | 'TLS' | 'SSL';
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
  notificationsEnabled: boolean;
  incomingEnabled: boolean;
  incomingHost: string;
  incomingPort: number;
  incomingEncryption: 'NONE' | 'SSL' | 'TLS';
  incomingUser: string;
  incomingPass: string;
  fetchInterval: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
}

export interface SystemManifest {
  global: {
    logoUrl: string;
    primaryColor: string;
    siteTitle: string;
    currency: string;
    logoWidth: number;
    logoHeight: number;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    bannerUrl: string;
    loginBgColor: string;
    loginBgImageUrl: string;
    termsContent: string;
    privacyContent: string;
  };
  email: EmailSettings;
  navigation: {
    dashboard: string;
    crm: string;
    projects: string;
    financials: string;
    tickets: string;
    admin: string;
    settings: string;
    services: string;
    audit: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    stat1: string;
    stat2: string;
    stat3: string;
    stat4: string;
  };
  crm: {
    title: string;
    subtitle: string;
    registerButton: string;
  };
  projects: {
    title: string;
    subtitle: string;
    stage1: string;
    stage2: string;
    stage3: string;
    stage4: string;
  };
  tickets: {
    title: string;
    priorityUrgent: string;
    priorityHigh: string;
    priorityMedium: string;
    priorityLow: string;
  };
  clientPortal: {
    title: string;
    welcomeMessage: string;
    tabSupport: string;
    tabFinance: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  avatar?: string;
  company?: string;
  password?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  permissions?: ViewType[];
  crudPermissions?: Partial<Record<ViewType, CrudPermissions>>;
  projectAccess?: 'ALL' | string[];
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
  uploadedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
  attachments?: Attachment[];
}

export interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  projectId?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'Todo' | 'Doing' | 'Done';
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  adminId: string;
  value: number;
  costs: number;
  awardRef: string;
  invoiceRef: string;
  taxRate: number;
  paymentRates: {
    first: number;
    second: number;
    third: number;
    final: number;
  };
  payments: ProjectPayment[];
  expectedCollections: ExpectedCollection[];
  guarantees: string;
  financialNotes: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  createdAt: string;
  startDate?: string;
  endDate?: string;
  tasks: ProjectTask[];
  attachments: Attachment[];
  serviceIds?: string[];
}

export interface ProjectPayment {
  id: string;
  amount: number;
  date: string;
  note: string;
  type?: 'UPFRONT' | 'PROGRESS' | 'FINAL' | 'VARIATION';
  invoiceRef?: string;
}

export interface ExpectedCollection {
  id: string;
  amount: number;
  expectedDate: string;
  note: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'Lead' | 'Prospect' | 'Active' | 'Churned';
  accountStatus: AccountStatus;
  lifetimeValue: number;
  totalPrice: number;
  paidAmount: number;
  lastContact: string;
  assignedTo: string;
  password?: string;
  description?: string;
  industry?: string;
}

export type ViewType = 'DASHBOARD' | 'TICKETS' | 'CRM' | 'PROJECT_PIPELINE' | 'FINANCIAL_PIPELINE' | 'ADMIN_MGMT' | 'CLIENT_PORTAL' | 'SETTINGS' | 'CLIENT_DETAIL' | 'SERVICES_CATALOG' | 'STAFF_EDIT' | 'PROJECT_CREATE' | 'AUDIT_LOG';
