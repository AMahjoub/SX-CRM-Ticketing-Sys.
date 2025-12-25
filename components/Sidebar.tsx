
import React from 'react';
import { ViewType, UserRole, User, SystemManifest } from '../types';

interface SidebarProps {
  isOpen: boolean;
  currentView: ViewType;
  setView: (view: ViewType) => void;
  user: User;
  manifest: SystemManifest;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentView, setView, user, manifest }) => {
  const allMenuItems = [
    { id: 'DASHBOARD' as ViewType, label: manifest.navigation.dashboard, icon: <DashboardIcon /> },
    { id: 'CRM' as ViewType, label: manifest.navigation.crm, icon: <UsersIcon /> },
    { id: 'SERVICES_CATALOG' as ViewType, label: manifest.navigation.services, icon: <ServicesIcon /> },
    { id: 'PROJECT_PIPELINE' as ViewType, label: manifest.navigation.projects, icon: <WorkflowIcon /> },
    { id: 'FINANCIAL_PIPELINE' as ViewType, label: manifest.navigation.financials, icon: <AccountingIcon /> },
    { id: 'TICKETS' as ViewType, label: manifest.navigation.tickets, icon: <TicketIcon /> },
  ];

  // Filtering Menu Items based on strict user permissions
  const menuItems = allMenuItems.filter(item => {
    // Root Admin and Admins usually see everything, but let's respect the user.permissions array for flexibility
    if (user.id === 'u-admin' || user.role === UserRole.ADMIN) return true;
    
    // Staff members only see what's in their permissions array
    if (user.role === UserRole.STAFF) {
      return user.permissions?.includes(item.id);
    }
    
    return false;
  });
  
  // Specific Admin view (Root admin only usually)
  if (user.role === UserRole.ADMIN) {
    menuItems.push({ id: 'ADMIN_MGMT' as ViewType, label: manifest.navigation.admin, icon: <AdminIcon /> });
    menuItems.push({ id: 'AUDIT_LOG' as ViewType, label: manifest.navigation.audit, icon: <AuditIcon /> });
  }

  // Always show Settings
  menuItems.push({ id: 'SETTINGS' as ViewType, label: manifest.navigation.settings, icon: <SettingsIcon /> });

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} hidden lg:flex bg-[#262626] text-slate-400 flex-col transition-all duration-300 ease-in-out border-r border-white/5 font-sans`}>
      <div className="flex flex-col h-full py-6">
        <div className={`px-4 mb-10 flex items-center transition-all justify-center ${isOpen ? 'justify-start' : ''}`}>
           <div className="flex items-center justify-center w-full">
            {manifest.global.logoUrl ? (
              <img 
                src={manifest.global.logoUrl} 
                style={{ 
                  width: isOpen ? `${manifest.global.logoWidth}px` : '32px', 
                  height: isOpen ? `${manifest.global.logoHeight}px` : '32px' 
                }} 
                className="object-contain transition-all" 
                alt="logo" 
              />
            ) : (
              <div style={{ color: manifest.global.primaryColor }} className="w-full flex justify-center">
                 <LogoIcon />
              </div>
            )}
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all font-normal ${
                currentView === item.id 
                ? 'text-white shadow-md' 
                : 'hover:bg-white/5 hover:text-white'
              }`}
              style={currentView === item.id ? { backgroundColor: manifest.global.primaryColor } : {}}
            >
              <span className="shrink-0">{item.icon}</span>
              {isOpen && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12L21 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ServicesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const WorkflowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const AccountingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2-2v14a2 2 0 002 2z" /></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const AuditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export default Sidebar;
