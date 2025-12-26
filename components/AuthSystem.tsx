import React, { useState, useMemo } from 'react';
import { User, UserRole, SystemManifest, AccountStatus } from '../types';

interface AuthSystemProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string, company: string, pass: string) => void;
  staffMembers: User[];
  clients: any[];
  manifest: SystemManifest;
}

const AuthSystem: React.FC<AuthSystemProps> = ({ onLogin, onRegister, staffMembers, clients, manifest }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [authMode, setAuthMode] = useState<'STAFF' | 'CLIENT'>('STAFF');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const existingCompanies = useMemo(() => {
    const names = clients.map(c => c.company).filter(Boolean);
    return Array.from(new Set(names));
  }, [clients]);

  const handleCredentialSubmit = (e: React.FormEvent) => {
    plus();
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isRegistering) {
      const finalCompany = isNewCompany ? customCompany : selectedCompany;
      if (!name || !email || !finalCompany || !password) {
        setError('Please complete all mandatory security fields.');
        return;
      }
      onRegister(name, email, finalCompany, password);
      setSuccess('Access request transmitted. Our administrators will verify your identity shortly.');
      setIsRegistering(false);
      setName('');
      setEmail('');
      setSelectedCompany('');
      setCustomCompany('');
      setIsNewCompany(false);
      setPassword('');
      return;
    }

    let foundUser: User | null = null;
    if (authMode === 'STAFF') {
      const staff = staffMembers.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (staff && staff.password === password) {
        foundUser = staff;
      } else {
        setError('Invalid staff credentials or unauthorized access.');
      }
    } else {
      const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
      if (client && client.password === password) {
        if (client.accountStatus !== AccountStatus.APPROVED) {
          setError('Identity profile is currently pending administrative authorization.');
        } else {
          foundUser = { 
            id: client.id, 
            name: client.name, 
            email: client.email, 
            role: UserRole.CLIENT, 
            status: client.accountStatus, 
            company: client.company, 
            avatar: `https://picsum.photos/seed/${client.email}/100/100` 
          };
        }
      } else {
        setError('Invalid client token or authentication failed.');
      }
    }

    if (foundUser) onLogin(foundUser);
  };

  const handleCompanyChange = (val: string) => {
    if (val === 'NEW_ENTITY') {
      setIsNewCompany(true);
      setSelectedCompany('NEW_ENTITY');
    } else {
      setIsNewCompany(false);
      setSelectedCompany(val);
    }
  };

  return (
    <div 
        className="min-h-screen flex items-center justify-center p-6 font-sans font-normal relative overflow-hidden bg-cover bg-center transition-all duration-700"
        style={{ 
            backgroundColor: manifest.auth.loginBgColor,
            backgroundImage: manifest.auth.loginBgImageUrl ? `url(${manifest.auth.loginBgImageUrl})` : 'none'
        }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>
      
      {!manifest.auth.loginBgImageUrl && (
          <>
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20" style={{ backgroundColor: manifest.global.primaryColor }}></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full blur-[100px] opacity-10" style={{ backgroundColor: manifest.global.primaryColor }}></div>
          </>
      )}

      <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden w-full max-w-5xl flex animate-in slide-in-from-bottom-8 duration-700 min-h-[700px] relative z-10">
        
        <div 
          className="w-1/2 p-12 text-white flex flex-col justify-between relative bg-[#0F172A] bg-cover bg-center transition-all duration-1000"
          style={manifest.auth.bannerUrl ? { backgroundImage: `url(${manifest.auth.bannerUrl})` } : {}}
        >
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] z-0"></div>

           <div className="relative z-10">
             {manifest.global.logoUrl && (
               <img 
                 src={manifest.global.logoUrl} 
                 style={{ width: `${manifest.global.logoWidth}px`, height: `${manifest.global.logoHeight}px` }} 
                 className="object-contain drop-shadow-2xl" 
                 alt="Logo" 
               />
             )}
           </div>

           <div className="mt-12 space-y-6 relative z-10 max-w-sm">
             {manifest.auth.loginTitle && <h2 className="text-4xl font-bold leading-tight break-words">{manifest.auth.loginTitle}</h2>}
             {manifest.auth.loginSubtitle && <p className="text-lg font-medium opacity-80 leading-relaxed break-words">{manifest.auth.loginSubtitle}</p>}
             
             <div className={`pt-10 border-t border-white/20 ${(!manifest.auth.loginTitle && !manifest.auth.loginSubtitle) ? 'mt-auto' : ''}`}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3 font-bold">Security Standard</p>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10"><ShieldIcon /></div>
                   <p className="text-xs text-white/70 font-normal leading-relaxed break-words">
                     End-to-end encryption active.<br/>
                     Managed by Securelogx Co.
                   </p>
                </div>
             </div>
           </div>
        </div>

        <div className="w-1/2 p-16 bg-white flex flex-col overflow-y-auto">
          <div className="mb-10">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{isRegistering ? 'Client Registry' : 'Authorized Access'}</h3>
            <p className="text-slate-400 text-sm">{isRegistering ? 'Submit your entity for approval.' : 'Enter your credentials to sync.'}</p>
          </div>
          
          {success && (
            <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 rounded-[15px] text-emerald-700 text-sm font-medium animate-in zoom-in-95 break-words">
              {success}
            </div>
          )}

          {!isRegistering && (
            <div className="flex bg-slate-100 p-1 rounded-[12px] mb-8 border border-slate-200">
              <button onClick={() => setAuthMode('STAFF')} className={`flex-1 py-3 rounded-[10px] text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'STAFF' ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-400'}`} style={authMode === 'STAFF' ? { color: manifest.global.primaryColor } : {}}>Team Access</button>
              <button onClick={() => setAuthMode('CLIENT')} className={`flex-1 py-3 rounded-[10px] text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'CLIENT' ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-400'}`} style={authMode === 'CLIENT' ? { color: manifest.global.primaryColor } : {}}>Client Access</button>
            </div>
          )}
          
          <form onSubmit={handleCredentialSubmit} className="space-y-6">
            {error && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-[12px] border border-rose-100 uppercase tracking-widest animate-shake break-words">{error}</div>}
            
            {isRegistering && (
              <div className="space-y-5 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity Name (Wraps)</label>
                  <textarea 
                    required 
                    rows={1}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[12px] outline-none text-sm transition-all focus:bg-white focus:ring-1 focus:ring-slate-300 resize-none break-words whitespace-pre-wrap" 
                    placeholder="e.g. John Smith" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Entity Company</label>
                  <select 
                    required 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[12px] outline-none text-sm appearance-none cursor-pointer"
                    value={selectedCompany}
                    onChange={e => handleCompanyChange(e.target.value)}
                  >
                    <option value="">Select Existing Profile...</option>
                    {existingCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="NEW_ENTITY" className="font-bold text-emerald-600">[+] Register New Entity</option>
                  </select>
                </div>

                {isNewCompany && (
                  <div className="space-y-1.5 animate-in zoom-in-95">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest ml-1">Company Label (Wraps)</label>
                    <textarea 
                      required 
                      rows={1}
                      className="w-full px-5 py-4 bg-white border border-emerald-200 rounded-[12px] outline-none text-sm font-medium resize-none break-words whitespace-pre-wrap" 
                      placeholder="Global Corp Ltd" 
                      value={customCompany} 
                      onChange={e => setCustomCompany(e.target.value)} 
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Email</label>
                <input required type="email" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[12px] outline-none text-sm focus:bg-white transition-all break-all" placeholder="user@domain.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Passphrase</label>
                <input required type="password" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[12px] outline-none text-sm focus:bg-white transition-all" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button type="submit" className="w-full py-4 text-white font-bold rounded-[12px] shadow-xl uppercase text-xs tracking-[0.2em] transition-all hover:brightness-110 active:scale-[0.98]" style={{ backgroundColor: manifest.global.primaryColor }}>
                {isRegistering ? 'Deploy Application' : 'Enter Secure Portal'}
              </button>

              <div className="flex justify-center gap-6 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <button type="button" onClick={() => setLegalModal('terms')} className="hover:text-slate-900 transition-colors">Terms and Conditions</button>
                <div className="w-px h-2.5 bg-slate-200 self-center"></div>
                <button type="button" onClick={() => setLegalModal('privacy')} className="hover:text-slate-900 transition-colors">Privacy Policy</button>
              </div>
            </div>
          </form>
          
          <div className="mt-auto pt-10 flex justify-center border-t border-slate-50">
            <button onClick={() => { setIsRegistering(!isRegistering); setSuccess(null); setError(null); }} className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors py-2 flex items-center gap-3 group">
              {isRegistering ? (
                <>Return to Gateway <ArrowRightIcon /></>
              ) : (
                <>Initialize New Client Profile <PlusIconSmall /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {legalModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[80vh]">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">
                 {legalModal === 'terms' ? 'Operational Protocol' : 'Data Privacy Registry'}
               </h3>
               <button onClick={() => setLegalModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><CloseIcon /></button>
             </div>
             <div className="p-10 overflow-y-auto font-normal text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                  {legalModal === 'terms' ? manifest.auth.termsContent : manifest.auth.privacyContent}
             </div>
             <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={() => setLegalModal(null)} className="px-10 py-3 bg-slate-900 text-white rounded-[12px] font-bold uppercase text-[10px] tracking-widest shadow-lg">Acknowledge Protocol</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const PlusIconSmall = () => (
  <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

function plus() {
  console.log('sx-mgmt-node-authorized');
}

export default AuthSystem;