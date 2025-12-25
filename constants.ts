
import { User, UserRole, Customer, Ticket, TicketStatus, TicketPriority, AccountStatus, ViewType } from './types';

const ALL_VIEWS: ViewType[] = ['DASHBOARD', 'CRM', 'PROJECT_PIPELINE', 'FINANCIAL_PIPELINE', 'TICKETS', 'SETTINGS'];

export const DEFAULT_ADMIN: User = {
  id: 'u-admin',
  name: 'Securelogx Admin',
  email: 'admin@securelogx.com',
  password: 'P@ssw0rd',
  role: UserRole.ADMIN,
  status: AccountStatus.APPROVED,
  avatar: 'https://picsum.photos/seed/admin/100/100',
  permissions: ALL_VIEWS
};

export const INITIAL_STAFF: User[] = [
  DEFAULT_ADMIN,
  {
    id: 'u-2',
    name: 'Sarah Kim',
    email: 'sarah.k@securelogx.com',
    password: 'password123',
    role: UserRole.STAFF,
    status: AccountStatus.APPROVED,
    avatar: 'https://picsum.photos/seed/sarahk/100/100',
    permissions: ['DASHBOARD', 'TICKETS', 'SETTINGS']
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c-1',
    name: 'Sarah Jenkins',
    company: 'Acme Inc.',
    email: 's.jenkins@acme.inc',
    phone: '+1 555-0123',
    status: 'Active',
    accountStatus: AccountStatus.APPROVED,
    lifetimeValue: 12500,
    totalPrice: 15000,
    paidAmount: 8500,
    lastContact: '2024-05-10',
    assignedTo: 'Securelogx Admin',
    password: 'clientpassword'
  },
  {
    id: 'cust-2',
    name: 'Michael Chen',
    company: 'Global Tech Solutions',
    email: 'm.chen@globaltech.com',
    phone: '+1 555-9876',
    status: 'Prospect',
    accountStatus: AccountStatus.PENDING,
    lifetimeValue: 0,
    totalPrice: 5000,
    paidAmount: 0,
    lastContact: '2024-05-12',
    assignedTo: 'Securelogx Admin'
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TKT-1001',
    clientId: 'c-1',
    clientName: 'Sarah Jenkins',
    clientCompany: 'Acme Inc.',
    subject: 'Cannot access billing dashboard',
    description: 'Every time I try to click on the billing tab, the page refreshes and logs me out.',
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    category: 'Billing',
    createdAt: '2024-05-14T10:00:00Z',
    updatedAt: '2024-05-14T10:00:00Z',
    messages: [
      {
        id: 'm-1',
        senderId: 'c-1',
        senderName: 'Sarah Jenkins',
        text: 'Every time I try to click on the billing tab, the page refreshes and logs me out.',
        timestamp: '2024-05-14T10:00:00Z',
        isAdmin: false
      }
    ]
  }
];
