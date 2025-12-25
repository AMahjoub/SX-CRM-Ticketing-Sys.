
import React, { useState, useMemo, useCallback } from 'react';
import { 
  User, 
  UserRole, 
  Customer, 
  Ticket, 
  ViewType, 
  TicketStatus, 
  TicketPriority,
  Message,
  AccountStatus,
  Project,
  ProjectPayment,
  SystemManifest,
  Attachment,
  Service,
  AuditLog
} from './types';
import { INITIAL_CUSTOMERS, INITIAL_TICKETS, INITIAL_STAFF } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CRMSystem from './components/CRMSystem';
import ProjectPipeline from './components/ProjectPipeline';
import ProjectCreate from './components/ProjectCreate';
import FinancialPipeline from './components/FinancialPipeline';
import TicketSystem from './components/TicketSystem';
import ClientPortal from './components/ClientPortal';
import AuthSystem from './components/AuthSystem';
import AdminManagement from './components/AdminManagement';
import ProfileSettings from './components/ProfileSettings';
import ClientDetail from './components/ClientDetail';
import ServicesCatalog from './components/ServicesCatalog';
import StaffEditor from './components/StaffEditor';
import AuditLogView from './components/AuditLogView';
import { triggerTicketCreatedNotification, triggerTicketReplyNotification } from './services/notificationService';

const INITIAL_MANIFEST: SystemManifest = {
  global: {
    logoUrl: '',
    primaryColor: '#006B35',
    siteTitle: 'SX MGMT',
    currency: 'SAR',
    logoWidth: 120,
    logoHeight: 32
  },
  auth: {
    loginTitle: '',
    loginSubtitle: '',
    bannerUrl: '',
    loginBgColor: '#1A1A1A',
    loginBgImageUrl: '',
    termsContent: 'By accessing this platform, you agree to comply with our infrastructure security protocols and confidentiality requirements. All actions are logged.',
    privacyContent: 'Securelogx Co. ensures end-to-end data encryption. Your project data and identity remain stored in secured local systems according to high-security standards.'
  },
  email: {
    provider: 'SMTP',
    host: 'smtp.securelogx.com',
    port: 587,
    encryption: 'TLS',
    auth: {
      user: 'notifications@securelogx.com',
      pass: '••••••••'
    },
    fromEmail: 'no-reply@securelogx.com',
    fromName: 'SX Support Desk',
    notificationsEnabled: true,
    incomingEnabled: false,
    incomingHost: 'imap.securelogx.com',
    incomingPort: 993,
    incomingEncryption: 'SSL',
    incomingUser: 'support@securelogx.com',
    incomingPass: '••••••••',
    fetchInterval: 5
  },
  navigation: {
    dashboard: 'Insights',
    crm: 'Client Registry',
    projects: 'Project Pipeline',
    financials: 'Financials',
    tickets: 'Support Queue',
    admin: 'Staff Mgmt',
    settings: 'Settings',
    services: 'Services',
    audit: 'Audit Registry'
  },
  dashboard: {
    title: 'Executive Intelligence',
    subtitle: 'Consolidated monitoring of Securelogx infrastructure performance.',
    stat1: 'Pipeline Value',
    stat2: 'Collected Liquidity',
    stat3: 'Support Load',
    stat4: 'Operations'
  },
  crm: {
    title: 'Client Registry',
    subtitle: 'Manage client identities and account approvals.',
    registerButton: 'Register New Client'
  },
  projects: {
    title: 'Project Management',
    subtitle: 'Manage leads and detailed active project lifecycles.',
    stage1: 'Lead',
    stage2: 'Prospect',
    stage3: 'Active',
    stage4: 'Churned'
  },
  tickets: {
    title: 'Support Desk',
    priorityUrgent: 'Urgent',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low'
  },
  clientPortal: {
    title: 'Client Hub',
    welcomeMessage: 'Portal secured by Securelogx Co.',
    tabSupport: 'Support',
    tabFinance: 'Finance'
  }
};

const INITIAL_SERVICES: Service[] = [
  { id: 'srv-1', name: 'Infrastructure Audit', description: 'Comprehensive security and network assessment.', basePrice: 5000 },
  { id: 'srv-2', name: 'Cloud Migration', description: 'Deployment of local systems to encrypted cloud clusters.', basePrice: 12000 },
  { id: 'srv-3', name: 'Endpoint Protection', description: '256-AES encryption layer deployment across all endpoints.', basePrice: 3500 },
];

const AccessDenied = ({ manifest }: { manifest: SystemManifest }) => (
  <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
    <div className="p-8 bg-rose-50 rounded-full text-rose-500 mb-6 border border-rose-100 shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0-8V5m0 0a2 2 0 100-4 2 2 0 000 4zm-3.342 1.101a6.002 6.002 0 0110.684 0M15 19h1a2 2 0 012 2v1H6v-1a2 2 0 012-2h1m6-4a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
    <h2 className="text-3xl font-medium text-slate-900 tracking-tight mb-2">Access Restricted</h2>
    <p className="text-slate-400 max-w-md mx-auto font-normal">Your current authorization level does not permit access to this module. Contact the platform administrator if you believe this is an error.</p>
    <button onClick={() => window.location.reload()} className="mt-8 px-10 py-3 bg-slate-900 text-white rounded-[12px] font-bold text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95">Restart Sync</button>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [staff, setStaff] = useState<User[]>(INITIAL_STAFF);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [manifest, setManifest] = useState<SystemManifest>(INITIAL_MANIFEST);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const logAction = useCallback((before: any, after: any) => {
    if (!currentUser) return;
    const logEntry: AuditLog = {
      user_name: currentUser.name,
      user_email: currentUser.email,
      action_datetime: new Date().toISOString(),
      before_change: before,
      after_change: after
    };
    setAuditLogs(prev => [logEntry, ...prev]);
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === UserRole.CLIENT) {
      setCurrentView('CLIENT_PORTAL');
    } else {
      if (user.role === UserRole.ADMIN || user.permissions?.includes('DASHBOARD')) {
        setCurrentView('DASHBOARD');
      } else {
        setCurrentView('SETTINGS');
      }
    }
  };

  const handleRegisterCustomer = useCallback((name: string, email: string, company: string, pass: string) => {
    const exists = customers.some(c => c.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      alert("A user with this email already exists.");
      return;
    }

    const newPendingCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name,
      company,
      email,
      phone: 'Not provided',
      status: 'Lead',
      accountStatus: AccountStatus.PENDING,
      lifetimeValue: 0,
      totalPrice: 0,
      paidAmount: 0,
      lastContact: new Date().toISOString().split('T')[0],
      assignedTo: staff[0]?.id || 'u-admin',
      password: pass
    };

    setCustomers(prev => [...prev, newPendingCustomer]);
    alert("Application submitted. Please wait for authorization.");
  }, [customers, staff]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
    setSelectedClientId(null);
    setSelectedStaffId(null);
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const before = { ...currentUser };
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    
    if (currentUser.role === UserRole.CLIENT) {
      setCustomers(prev => prev.map(c => c.id === currentUser.id ? { ...c, name: updates.name || c.name } : c));
    } else {
      setStaff(prev => prev.map(s => s.id === currentUser.id ? { ...s, ...updates } : s));
    }
    logAction(before, updatedUser);
  };

  const handleUpdateManifest = (newManifest: SystemManifest) => {
    const before = { ...manifest };
    setManifest(newManifest);
    logAction(before, newManifest);
  };

  const handleUpdateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeleteCustomer = useCallback((id: string) => {
    if (confirm('Permanently delete this client and all associated records?')) {
      const target = customers.find(c => c.id === id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      setProjects(prev => prev.filter(p => p.clientId !== id));
      setTickets(prev => prev.filter(t => t.clientId !== id));
      if (selectedClientId === id) setSelectedClientId(null);
      logAction(target, null);
    }
  }, [selectedClientId, customers, logAction]);

  const handleDeleteStaff = useCallback((id: string) => {
    if (id === 'u-admin') {
      alert('Root administrator cannot be deleted.');
      return;
    }
    if (confirm('Revoke access and delete this staff member?')) {
      const target = staff.find(s => s.id === id);
      setStaff(prev => prev.filter(s => s.id !== id));
      logAction(target, null);
    }
  }, [staff, logAction]);

  const addTicketMessage = useCallback((ticketId: string, text: string, attachments?: Attachment[]) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const newMessage: Message = {
          id: `m-${Date.now()}`,
          senderId: currentUser?.id || '',
          senderName: currentUser?.name || 'System',
          text,
          timestamp: new Date().toISOString(),
          isAdmin: currentUser?.role !== UserRole.CLIENT,
          attachments: attachments && attachments.length > 0 ? attachments : undefined
        };
        
        const recipientEmail = currentUser?.role === UserRole.CLIENT 
          ? manifest.email.fromEmail 
          : customers.find(c => c.id === t.clientId)?.email || '';

        if (recipientEmail) {
          triggerTicketReplyNotification(manifest, recipientEmail, ticketId, currentUser?.name || 'Agent');
        }

        return {
          ...t,
          updatedAt: newMessage.timestamp,
          messages: [...t.messages, newMessage]
        };
      }
      return t;
    }));
  }, [currentUser, customers, manifest]);

  const updateTicketStatus = useCallback((ticketId: string, status: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
  }, []);

  const handleAddProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
    setCurrentView('PROJECT_PIPELINE'); 
    logAction(null, project);
  };

  const handleAddProjectPayment = (projectId: string, payment: ProjectPayment) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, payments: [...p.payments, payment] };
      }
      return p;
    }));
  };

  const createNewTicket = useCallback((subject: string, desc: string, category: string, priority: TicketPriority, attachments?: Attachment[], projectId?: string) => {
    if (!currentUser) return;
    const newTicket: Ticket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: currentUser.id,
      clientName: currentUser.name,
      clientCompany: currentUser.company,
      projectId,
      subject,
      description: desc,
      status: TicketStatus.OPEN,
      priority,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: `m-${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: desc,
        timestamp: new Date().toISOString(),
        isAdmin: false,
        attachments: attachments && attachments.length > 0 ? attachments : undefined
      }]
    };
    setTickets(prev => [newTicket, ...prev]);
    triggerTicketCreatedNotification(manifest, currentUser.email, newTicket.id);
  }, [currentUser, manifest]);

  const handleProcessPayment = useCallback((amount: number) => {
    if (!currentUser) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === currentUser.id) {
        return {
          ...c,
          paidAmount: c.paidAmount + amount,
          lifetimeValue: c.lifetimeValue + amount,
          lastContact: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    }));
  }, [currentUser]);

  const handleUpdateStaff = (id: string, updates: Partial<User>) => {
    const before = staff.find(s => s.id === id);
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    logAction(before, updates);
  };

  const addStaff = (newMember: User) => {
    setStaff(prev => [...prev, newMember]);
    logAction(null, newMember);
  };

  const handleAddService = (srv: Service) => {
    setServices(prev => [...prev, srv]);
    logAction(null, srv);
  };
  const handleUpdateService = (id: string, updates: Partial<Service>) => {
    const before = services.find(s => s.id === id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    logAction(before, updates);
  };
  const handleDeleteService = (id: string) => {
    const target = services.find(s => s.id === id);
    setServices(prev => prev.filter(s => s.id !== id));
    logAction(target, null);
  };

  const mainContent = useMemo(() => {
    if (!currentUser) return null;

    if (currentUser.role !== UserRole.CLIENT) {
      const isRootAdmin = currentUser.id === 'u-admin';
      const allowedViews = currentUser.permissions || [];
      const alwaysAllowed: ViewType[] = ['SETTINGS', 'STAFF_EDIT']; 

      if (!isRootAdmin && !alwaysAllowed.includes(currentView) && !allowedViews.includes(currentView)) {
        if (currentView === 'CLIENT_DETAIL' && !allowedViews.includes('CRM')) return <AccessDenied manifest={manifest} />;
        if (currentView === 'PROJECT_CREATE' && !allowedViews.includes('PROJECT_PIPELINE')) return <AccessDenied manifest={manifest} />;
        if (currentView !== 'CLIENT_DETAIL' && currentView !== 'PROJECT_CREATE') return <AccessDenied manifest={manifest} />;
      }
    }

    if (currentView === 'SETTINGS') {
      return (
        <ProfileSettings 
          user={currentUser} 
          onUpdate={handleUpdateProfile} 
          manifest={manifest} 
          onUpdateManifest={handleUpdateManifest}
        />
      );
    }

    if (currentUser.role === UserRole.CLIENT) {
      const clientProfile = customers.find(c => c.id === currentUser.id);
      return (
        <ClientPortal 
          tickets={tickets.filter(t => t.clientId === currentUser.id)} 
          projects={projects.filter(p => p.clientId === currentUser.id)}
          onCreateTicket={createNewTicket}
          onReply={addTicketMessage}
          user={currentUser}
          customerData={clientProfile}
          onMakePayment={handleProcessPayment}
          manifest={manifest}
        />
      );
    }

    if (currentView === 'CLIENT_DETAIL' && selectedClientId) {
      const client = customers.find(c => c.id === selectedClientId);
      if (client) {
        return (
          <ClientDetail 
            customer={client}
            projects={projects}
            tickets={tickets.filter(t => t.clientId === client.id)}
            staff={staff}
            manifest={manifest}
            onUpdateCustomer={handleUpdateCustomer}
            onUpdateProject={handleUpdateProject}
            onUpdateTicketStatus={updateTicketStatus}
            onReplyToTicket={addTicketMessage}
            onBack={() => { setCurrentView('CRM'); setSelectedClientId(null); }}
          />
        );
      }
    }

    if (currentView === 'STAFF_EDIT' && selectedStaffId) {
      const targetStaff = staff.find(s => s.id === selectedStaffId);
      if (targetStaff) {
        return (
          <StaffEditor 
            staffMember={targetStaff}
            manifest={manifest}
            onUpdate={(updates) => { handleUpdateStaff(selectedStaffId, updates); setCurrentView('ADMIN_MGMT'); setSelectedStaffId(null); }}
            onBack={() => { setCurrentView('ADMIN_MGMT'); setSelectedStaffId(null); }}
          />
        );
      }
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard customers={customers} tickets={tickets} projects={projects} manifest={manifest} auditLogs={auditLogs} />;
      case 'CRM':
        return (
          <CRMSystem 
            customers={customers} 
            setCustomers={setCustomers} 
            currentUser={currentUser}
            onDelete={handleDeleteCustomer}
            manifest={manifest}
            onViewDetails={(id) => { setSelectedClientId(id); setCurrentView('CLIENT_DETAIL'); }}
          />
        );
      case 'SERVICES_CATALOG':
        return (
          <ServicesCatalog 
            services={services}
            onAdd={handleAddService}
            onUpdate={handleUpdateService}
            onDelete={handleDeleteService}
            manifest={manifest}
          />
        );
      case 'PROJECT_PIPELINE':
        return (
          <ProjectPipeline 
            customers={customers} 
            staff={staff} 
            projects={projects}
            tickets={tickets}
            services={services}
            currentUser={currentUser}
            onUpdateProject={handleUpdateProject}
            onAddProject={handleAddProject} 
            onAddPayment={handleAddProjectPayment}
            manifest={manifest}
            onSwitchToCreate={() => setCurrentView('PROJECT_CREATE')}
          />
        );
      case 'PROJECT_CREATE':
        return (
          <ProjectCreate 
            customers={customers}
            staff={staff}
            services={services}
            currentUser={currentUser}
            onAddProject={handleAddProject}
            onBack={() => setCurrentView('PROJECT_PIPELINE')}
            manifest={manifest}
          />
        );
      case 'FINANCIAL_PIPELINE':
        return <FinancialPipeline projects={projects} customers={customers} manifest={manifest} />;
      case 'TICKETS':
        return (
          <TicketSystem 
            tickets={tickets} 
            onUpdateStatus={updateTicketStatus} 
            onReply={addTicketMessage}
            manifest={manifest}
          />
        );
      case 'ADMIN_MGMT':
        return (
          <AdminManagement 
            staffMembers={staff} 
            onAddStaff={addStaff} 
            onDelete={handleDeleteStaff}
            manifest={manifest}
            onEditStaff={(id) => { setSelectedStaffId(id); setCurrentView('STAFF_EDIT'); }}
          />
        );
      case 'AUDIT_LOG':
        return <AuditLogView logs={auditLogs} manifest={manifest} />;
      default:
        return <Dashboard customers={customers} tickets={tickets} projects={projects} manifest={manifest} auditLogs={auditLogs} />;
    }
  }, [currentView, currentUser, customers, tickets, staff, projects, services, manifest, createNewTicket, addTicketMessage, updateTicketStatus, handleDeleteCustomer, handleDeleteStaff, selectedClientId, selectedStaffId, handleUpdateProject, handleUpdateCustomer, handleProcessPayment, handleUpdateStaff, handleAddProject, handleUpdateManifest, auditLogs, handleAddService, handleUpdateService, handleDeleteService]);

  if (!currentUser) {
    return (
      <AuthSystem 
        onLogin={handleLogin} 
        onRegister={handleRegisterCustomer}
        staffMembers={staff} 
        clients={customers} 
        manifest={manifest} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {currentUser.role !== UserRole.CLIENT && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          currentView={currentView} 
          setView={setCurrentView} 
          user={currentUser}
          manifest={manifest}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-6">
            {currentUser.role !== UserRole.CLIENT && (
               <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-3 text-slate-500 hover:bg-slate-100 rounded-[10px] transition-colors"
               >
                 <MenuIcon />
               </button>
            )}
            <div 
              onClick={() => { setCurrentView(currentUser.role === UserRole.CLIENT ? 'CLIENT_PORTAL' : 'DASHBOARD'); setSelectedClientId(null); setSelectedStaffId(null); }} 
              className="cursor-pointer flex items-center"
            >
              {manifest.global.logoUrl ? (
                <img 
                  src={manifest.global.logoUrl} 
                  style={{ width: `${manifest.global.logoWidth}px`, height: `${manifest.global.logoHeight}px` }} 
                  className="object-contain" 
                  alt="logo" 
                />
              ) : (
                <h1 className="text-2xl font-medium tracking-tighter" style={{ color: manifest.global.primaryColor }}>
                  [ {manifest.global.siteTitle.split(' ')[0]} <span className="text-slate-900">{manifest.global.siteTitle.split(' ').slice(1).join(' ') || 'MGMT'}</span> ]
                </h1>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 leading-none">{currentUser.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-widest mt-1" style={{ color: manifest.global.primaryColor }}>
                  {currentUser.role === UserRole.CLIENT ? currentUser.company : currentUser.role}
                </p>
              </div>
              <div className="relative group">
                <button className="flex items-center">
                  <img src={currentUser.avatar} className="w-11 h-11 rounded-[10px] border-2 border-white shadow-md object-cover transition-transform group-hover:scale-105" alt="" />
                </button>
                <div className="absolute right-0 top-14 w-56 bg-white rounded-[10px] shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                   <button 
                    onClick={() => setCurrentView('SETTINGS')}
                    className="w-full text-left px-5 py-3 text-slate-700 text-xs font-medium uppercase tracking-widest hover:bg-slate-50 rounded-[10px] transition-all flex items-center gap-3"
                   >
                     <SettingsIconSmall /> Profile Settings
                   </button>
                   <div className="h-px bg-slate-100 my-1 mx-4"></div>
                   <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-rose-600 text-xs font-medium uppercase tracking-widest hover:bg-rose-50 rounded-[10px] transition-all flex items-center gap-3">
                     <LogoutIcon /> Terminate Session
                   </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {mainContent}
          <footer className="p-10 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.3em]">
              Saudi Made By <a href="https://www.sx.sa" target="_blank" rel="noopener noreferrer" className="hover:underline transition-all" style={{ color: manifest.global.primaryColor }}>Securelogx</a> , &copy; All Rights Reserved {new Date().getFullYear()}.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SettingsIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default App;
