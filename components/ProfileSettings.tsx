
import React, { useState, useEffect } from 'react';
import { User, UserRole, SystemManifest } from '../types';

interface ProfileSettingsProps {
  user: User;
  onUpdate: (updates: Partial<User>) => void;
  manifest: SystemManifest;
  onUpdateManifest: (config: SystemManifest) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdate, manifest, onUpdateManifest }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'STUDIO'>('PROFILE');
  const [studioSection, setStudioSection] = useState<'CORE' | 'NAV' | 'EMAIL' | 'LEGAL'>('CORE');
  
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState(user.password || '');
  const [isSuccess, setIsSuccess] = useState(false);

  const [localManifest, setLocalManifest] = useState<SystemManifest>(JSON.parse(JSON.stringify(manifest)));
  const [isTestingConnection, setIsTestingConnection] = useState<'OUTGOING' | 'INCOMING' | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string; target: 'OUTGOING' | 'INCOMING' } | null>(null);

  useEffect(() => {
    setLocalManifest(JSON.parse(JSON.stringify(manifest)));
  }, [manifest]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ name, password });
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Maximum size is 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ avatar: reader.result as string });
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStudioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateManifest(localManifest);
    alert('System manifest deployed and synced successfully.');
  };

  const updateStudioField = (section: keyof SystemManifest, field: string, value: any) => {
    setLocalManifest(prev => {
      const updatedSection = { ...(prev[section] as any) };
      // Handle nested auth object for email
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updatedSection[parent] = { ...updatedSection[parent], [child]: value };
      } else {
        updatedSection[field] = value;
      }
      return { ...prev, [section]: updatedSection };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, manifestSection: keyof SystemManifest, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File too large. Maximum size is 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateStudioField(manifestSection, field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateEmailTest = (target: 'OUTGOING' | 'INCOMING') => {
    setIsTestingConnection(target);
    setTestResult(null);
    const host = target === 'OUTGOING' ? localManifest.email.host : localManifest.email.incomingHost;
    
    setTimeout(() => {
      setIsTestingConnection(null);
      setTestResult({ 
        success: true, 
        msg: `Handshake with ${host || 'endpoint'} established. Authentication protocol verified.`,
        target 
      });
    }, 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans font-normal pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">System Settings</h2>
          <p className="text-slate-500 font-normal">Configure identity parameters and platform architecture.</p>
        </div>
        {user.role === UserRole.ADMIN && (
          <div className="flex bg-slate-100 p-1 rounded-[12px] border border-slate-200">
            <button 
              onClick={() => setActiveTab('PROFILE')} 
              className={`px-8 py-2.5 rounded-[10px] text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'PROFILE' ? 'bg-white shadow-sm' : 'text-slate-400'}`} 
              style={activeTab === 'PROFILE' ? { color: manifest.global.primaryColor } : {}}
            >
              My Profile
            </button>
            <button 
              onClick={() => setActiveTab('STUDIO')} 
              className={`px-8 py-2.5 rounded-[10px] text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'STUDIO' ? 'bg-white shadow-sm' : 'text-slate-400'}`} 
              style={activeTab === 'STUDIO' ? { color: manifest.global.primaryColor } : {}}
            >
              UI Studio
            </button>
          </div>
        )}
      </div>

      {activeTab === 'PROFILE' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm p-10 max-w-3xl">
            <div className="flex flex-col md:flex-row items-center gap-10 mb-10 pb-10 border-b border-slate-50">
               <div className="relative group">
                  <div className="w-32 h-32 rounded-[25px] overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-100">
                     <img src={user.avatar} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Avatar" />
                  </div>
                  <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all border-4 border-white">
                     <CameraIcon />
                     <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
               </div>
               <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl font-bold text-slate-900">{user.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{user.role} Identity Cluster</p>
                  <p className="text-[11px] text-slate-400 mt-3 max-w-xs leading-relaxed">Identity artifact is synchronized across all infrastructure modules.</p>
               </div>
            </div>

            <h3 className="text-xl font-medium text-slate-900 mb-8">Identity Credentials</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-8">
              {isSuccess && <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-[12px] border border-emerald-100 uppercase tracking-widest animate-in zoom-in-95">Protocol Synchronized.</div>}
              <div className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Identity Name (Wraps)</label>
                    <textarea 
                      rows={1}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none font-medium text-sm focus:bg-white focus:ring-1 focus:ring-slate-300 transition-all resize-none break-words break-all whitespace-pre-wrap" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Passphrase</label>
                    <input required type="password" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none font-bold text-sm focus:bg-white transition-all" placeholder="New passphrase" value={password} onChange={e => setPassword(e.target.value)} />
                 </div>
              </div>
              <button type="submit" className="px-12 py-4 text-white font-bold rounded-[12px] shadow-lg uppercase text-[10px] tracking-[0.2em] transition-all hover:brightness-110 active:scale-95" style={{ backgroundColor: manifest.global.primaryColor }}>Update Identity Profile</button>
            </form>
          </div>
          <div className="bg-rose-50 rounded-[20px] p-10 border border-rose-100 flex items-center justify-between max-w-3xl">
            <div>
              <h4 className="font-bold text-rose-900 uppercase tracking-widest text-xs">Terminate Session</h4>
              <p className="text-rose-400 text-[10px] mt-1 uppercase font-medium">Safely exit the management system.</p>
            </div>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-rose-600 text-white font-bold rounded-[10px] text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95">Logout Now</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[25px] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[850px]">
           <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-3 shrink-0">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6 px-4">Architectural Modules</h3>
             {[
               { id: 'CORE', label: 'Core Branding' },
               { id: 'EMAIL', label: 'Email Integration' },
               { id: 'LEGAL', label: 'Legal Architecture' },
               { id: 'NAV', label: 'Navigation Labels' },
             ].map(s => (
               <button 
                key={s.id}
                onClick={() => setStudioSection(s.id as any)}
                className={`text-left px-6 py-4 rounded-[15px] text-[11px] font-bold uppercase tracking-widest transition-all ${studioSection === s.id ? 'bg-white shadow-md' : 'text-slate-400 hover:bg-white/50'}`}
                style={studioSection === s.id ? { color: manifest.global.primaryColor } : {}}
               >
                 {s.label}
               </button>
             ))}
             <div className="mt-auto pt-8 border-t border-slate-100">
               <button 
                onClick={handleStudioSubmit}
                className="w-full py-4 text-white font-bold rounded-[12px] shadow-xl uppercase text-[10px] tracking-[0.2em] transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: manifest.global.primaryColor }}
               >
                 Deploy System Update
               </button>
             </div>
           </div>

           <div className="flex-1 p-12 overflow-y-auto bg-white">
             {studioSection === 'CORE' && (
               <div className="space-y-12 animate-in fade-in duration-500">
                 <div>
                    <h4 className="text-2xl font-medium text-slate-900 tracking-tight">Identity Branding</h4>
                    <p className="text-slate-400 text-sm mt-1">Configure platform visual identifiers and color logic.</p>
                 </div>
                 
                 <div className="space-y-10">
                   <div className="space-y-4">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Platform Logo Artifact</label>
                     <div className="flex items-center gap-10 p-8 bg-slate-50 border border-slate-200 rounded-[20px] shadow-inner">
                        <div className="w-40 h-40 bg-white rounded-[15px] border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-4">
                          {localManifest.global.logoUrl ? (
                            <img 
                                src={localManifest.global.logoUrl} 
                                style={{ 
                                    width: `${(localManifest.global.logoWidth / 2)}px`, 
                                    height: 'auto' 
                                }} 
                                className="max-w-full max-h-full object-contain" 
                                alt="Logo Preview" 
                            />
                          ) : (
                            <LogoPlaceholderIcon />
                          )}
                        </div>
                        <div className="flex-1 space-y-6">
                           <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-tight">Upload high-resolution PNG/SVG. Best results with transparent backgrounds.</p>
                           <div className="flex items-center gap-4">
                              <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={(e) => handleFileUpload(e, 'global', 'logoUrl')} />
                              <label htmlFor="logo-upload" className="px-8 py-3 bg-white border border-slate-200 rounded-[10px] text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-all shadow-sm">Replace Identity File</label>
                              {localManifest.global.logoUrl && <button onClick={() => updateStudioField('global', 'logoUrl', '')} className="text-rose-600 text-[10px] font-bold uppercase tracking-widest px-4 hover:underline">Revoke Logo</button>}
                           </div>
                           <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logo Render Width: {localManifest.global.logoWidth}px</label>
                                    <input type="range" min="50" max="300" step="10" className="w-full accent-slate-900" value={localManifest.global.logoWidth} onChange={e => updateStudioField('global', 'logoWidth', Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logo Render Height: {localManifest.global.logoHeight}px</label>
                                    <input type="range" min="20" max="100" step="4" className="w-full accent-slate-900" value={localManifest.global.logoHeight} onChange={e => updateStudioField('global', 'logoHeight', Number(e.target.value))} />
                                </div>
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* LOGIN BANNER UPLOAD SECTION */}
                   <div className="space-y-4 pt-10 border-t border-slate-50">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Login Card Side-Banner</label>
                     <div className="flex items-center gap-10 p-8 bg-slate-50 border border-slate-200 rounded-[20px] shadow-inner">
                        <div className="w-40 h-40 bg-white rounded-[15px] border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                          {localManifest.auth.bannerUrl ? (
                            <img 
                                src={localManifest.auth.bannerUrl} 
                                className="w-full h-full object-cover" 
                                alt="Banner Preview" 
                            />
                          ) : (
                            <div className="bg-slate-900 w-full h-full flex items-center justify-center">
                                <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Default Banner</div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-6">
                           <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-tight">This image will appear as the background of the Login page left-panel card.</p>
                           <div className="flex items-center gap-4">
                              <input type="file" accept="image/*" className="hidden" id="banner-upload" onChange={(e) => handleFileUpload(e, 'auth', 'bannerUrl')} />
                              <label htmlFor="banner-upload" className="px-8 py-3 bg-white border border-slate-200 rounded-[10px] text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-all shadow-sm">Replace Banner File</label>
                              {localManifest.auth.bannerUrl && <button onClick={() => updateStudioField('auth', 'bannerUrl', '')} className="text-rose-600 text-[10px] font-bold uppercase tracking-widest px-4 hover:underline">Revoke Banner</button>}
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* FULL LOGIN BACKGROUND SECTION */}
                   <div className="space-y-4 pt-10 border-t border-slate-50">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Global Login Page Background</label>
                     <div className="flex items-center gap-10 p-8 bg-slate-50 border border-slate-200 rounded-[20px] shadow-inner">
                        <div className="w-40 h-40 bg-white rounded-[15px] border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                          {localManifest.auth.loginBgImageUrl ? (
                            <img 
                                src={localManifest.auth.loginBgImageUrl} 
                                className="w-full h-full object-cover" 
                                alt="Full BG Preview" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: localManifest.auth.loginBgColor }}>
                                <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">No Image Set</div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-6">
                           <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-tight">This image serves as the full-screen backdrop for the entire login gateway.</p>
                           <div className="flex items-center gap-4">
                              <input type="file" accept="image/*" className="hidden" id="login-bg-upload" onChange={(e) => handleFileUpload(e, 'auth', 'loginBgImageUrl')} />
                              <label htmlFor="login-bg-upload" className="px-8 py-3 bg-white border border-slate-200 rounded-[10px] text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-all shadow-sm">Upload Backdrop</label>
                              {localManifest.auth.loginBgImageUrl && <button onClick={() => updateStudioField('auth', 'loginBgImageUrl', '')} className="text-rose-600 text-[10px] font-bold uppercase tracking-widest px-4 hover:underline">Revoke Image</button>}
                           </div>
                           <div className="space-y-2 pt-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base Environment Color</label>
                                <div className="flex gap-3">
                                    <input 
                                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-[10px] text-[10px] font-bold outline-none uppercase" 
                                        value={localManifest.auth.loginBgColor} 
                                        onChange={e => updateStudioField('auth', 'loginBgColor', e.target.value)} 
                                    />
                                    <div className="w-10 h-10 rounded-[10px] border-2 border-white shadow-md" style={{ backgroundColor: localManifest.auth.loginBgColor }}></div>
                                </div>
                           </div>
                        </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Primary Brand Color</label>
                        <div className="flex gap-4">
                           <input 
                                className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] text-sm font-bold outline-none uppercase" 
                                value={localManifest.global.primaryColor} 
                                onChange={e => updateStudioField('global', 'primaryColor', e.target.value)} 
                           />
                           <div className="w-16 h-14 rounded-[15px] border-4 border-white shadow-xl" style={{ backgroundColor: localManifest.global.primaryColor }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">System Label (Wraps)</label>
                        <textarea 
                            rows={1}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] text-sm font-bold outline-none resize-none break-words break-all whitespace-pre-wrap focus:bg-white focus:ring-1 focus:ring-slate-300 min-h-[56px]" 
                            value={localManifest.global.siteTitle} 
                            onChange={e => updateStudioField('global', 'siteTitle', e.target.value)} 
                        />
                      </div>
                   </div>
                 </div>
               </div>
             )}

             {studioSection === 'EMAIL' && (
               <div className="space-y-16 animate-in fade-in duration-500 pb-20">
                 <div>
                    <h4 className="text-2xl font-medium text-slate-900 tracking-tight">Communication Architecture</h4>
                    <p className="text-slate-400 text-sm mt-1">Bind the system to your SMTP/IMAP infrastructure for bidirectional signaling.</p>
                 </div>

                 {/* Outgoing SMTP Panel */}
                 <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white"><ArrowUpRightIcon /></div>
                            <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Outgoing Dispatch (SMTP)</h5>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Alerts Active</span>
                            <div className={`w-10 h-5 rounded-full relative transition-all ${localManifest.email.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => updateStudioField('email', 'notificationsEnabled', !localManifest.email.notificationsEnabled)}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${localManifest.email.notificationsEnabled ? 'left-5.5' : 'left-0.5'}`}></div>
                            </div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Provider Engine</label>
                            <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none text-sm font-bold" value={localManifest.email.provider} onChange={e => updateStudioField('email', 'provider', e.target.value)}>
                                <option value="SMTP">Standard SMTP Relay</option>
                                <option value="SENDGRID">SendGrid API</option>
                                <option value="MAILGUN">Mailgun Logic</option>
                                <option value="SES">Amazon SES Cluster</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SMTP Endpoint</label>
                            <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-medium outline-none" value={localManifest.email.host} onChange={e => updateStudioField('email', 'host', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Port & Encryption</label>
                            <div className="flex gap-3">
                                <input type="number" className="w-24 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-bold outline-none" value={localManifest.email.port} onChange={e => updateStudioField('email', 'port', Number(e.target.value))} />
                                <select className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none text-sm font-bold" value={localManifest.email.encryption} onChange={e => updateStudioField('email', 'encryption', e.target.value)}>
                                    <option value="TLS">STARTTLS</option>
                                    <option value="SSL">SSL/TLS</option>
                                    <option value="NONE">Unsecured</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dispatcher Identity (Wraps)</label>
                            <textarea rows={1} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-bold outline-none resize-none break-words whitespace-pre-wrap" value={localManifest.email.fromName} onChange={e => updateStudioField('email', 'fromName', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SMTP User Identity</label>
                            <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-medium outline-none" value={localManifest.email.auth.user} onChange={e => updateStudioField('email', 'auth.user', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SMTP Access Passphrase</label>
                            <input type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-bold outline-none" value={localManifest.email.auth.pass} onChange={e => updateStudioField('email', 'auth.pass', e.target.value)} />
                        </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-[20px] flex items-center justify-between">
                         <div className="min-w-0 flex-1 pr-4">
                             <p className="text-[10px] font-bold text-slate-900 uppercase">Test Outgoing Path</p>
                             <p className="text-[9px] text-slate-400 uppercase mt-1">Simulate a protocol handshake with the dispatcher.</p>
                         </div>
                         <button 
                            type="button"
                            onClick={() => simulateEmailTest('OUTGOING')}
                            disabled={isTestingConnection === 'OUTGOING'}
                            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-[10px] text-[9px] uppercase tracking-[0.2em] shadow-lg disabled:opacity-50 flex items-center gap-3 shrink-0"
                         >
                            {isTestingConnection === 'OUTGOING' ? <LoadingSpinnerIcon /> : <LinkIcon />}
                            {isTestingConnection === 'OUTGOING' ? 'Syncing...' : 'Execute Test'}
                         </button>
                    </div>
                    {testResult?.target === 'OUTGOING' && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[12px] text-emerald-700 text-[10px] font-bold uppercase tracking-widest animate-in zoom-in-95">{testResult.msg}</div>
                    )}
                 </div>

                 {/* Incoming IMAP Panel */}
                 <div className="space-y-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white"><ArrowDownLeftIcon /></div>
                            <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Incoming Support Sync (IMAP)</h5>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Sync Logic Active</span>
                            <div className={`w-10 h-5 rounded-full relative transition-all ${localManifest.email.incomingEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => updateStudioField('email', 'incomingEnabled', !localManifest.email.incomingEnabled)}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${localManifest.email.incomingEnabled ? 'left-5.5' : 'left-0.5'}`}></div>
                            </div>
                        </label>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 transition-all duration-500 ${localManifest.email.incomingEnabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">IMAP Synchronization Host</label>
                            <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-medium outline-none" placeholder="imap.domain.com" value={localManifest.email.incomingHost} onChange={e => updateStudioField('email', 'incomingHost', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sync Port & Encryption</label>
                            <div className="flex gap-3">
                                <input type="number" className="w-24 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-bold outline-none" value={localManifest.email.incomingPort} onChange={e => updateStudioField('email', 'incomingPort', Number(e.target.value))} />
                                <select className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none text-sm font-bold" value={localManifest.email.incomingEncryption} onChange={e => updateStudioField('email', 'incomingEncryption', e.target.value)}>
                                    <option value="SSL">SSL/TLS (Implicit)</option>
                                    <option value="TLS">STARTTLS</option>
                                    <option value="NONE">Unsecured</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Support Registry Identity</label>
                            <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-medium outline-none" placeholder="support@domain.com" value={localManifest.email.incomingUser} onChange={e => updateStudioField('email', 'incomingUser', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registry Passphrase</label>
                            <input type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-bold outline-none" value={localManifest.email.incomingPass} onChange={e => updateStudioField('email', 'incomingPass', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Polling Interval (Minutes)</label>
                            <input type="number" min="1" max="60" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-bold outline-none" value={localManifest.email.fetchInterval} onChange={e => updateStudioField('email', 'fetchInterval', Number(e.target.value))} />
                        </div>
                    </div>

                    <div className={`p-6 bg-slate-50 border border-slate-200 rounded-[20px] flex items-center justify-between transition-all duration-500 ${localManifest.email.incomingEnabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                         <div className="min-w-0 flex-1 pr-4">
                             <p className="text-[10px] font-bold text-slate-900 uppercase">Audit Incoming Path</p>
                             <p className="text-[9px] text-slate-400 uppercase mt-1">Verify connectivity to the support mailbox registry.</p>
                         </div>
                         <button 
                            type="button"
                            onClick={() => simulateEmailTest('INCOMING')}
                            disabled={isTestingConnection === 'INCOMING'}
                            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-[10px] text-[9px] uppercase tracking-[0.2em] shadow-lg disabled:opacity-50 flex items-center gap-3 shrink-0"
                         >
                            {isTestingConnection === 'INCOMING' ? <LoadingSpinnerIcon /> : <LinkIcon />}
                            {isTestingConnection === 'INCOMING' ? 'Auditing...' : 'Execute Audit'}
                         </button>
                    </div>
                    {testResult?.target === 'INCOMING' && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[12px] text-emerald-700 text-[10px] font-bold uppercase tracking-widest animate-in zoom-in-95">{testResult.msg}</div>
                    )}
                 </div>
               </div>
             )}

             {studioSection === 'LEGAL' && (
               <div className="space-y-12 animate-in fade-in duration-500">
                 <div>
                    <h4 className="text-2xl font-medium text-slate-900 tracking-tight">Legal Architecture Registry</h4>
                    <p className="text-slate-400 text-sm mt-1">Edit the infrastructure operational protocols and data privacy guidelines.</p>
                 </div>

                 <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Infrastructure Operational Protocols (Terms)</label>
                        <textarea 
                            rows={10} 
                            className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[25px] text-sm leading-relaxed font-normal outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 transition-all resize-none break-words whitespace-pre-wrap shadow-inner" 
                            value={localManifest.auth.termsContent} 
                            onChange={e => updateStudioField('auth', 'termsContent', e.target.value)} 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Data Privacy & Encryption Guideline (Privacy)</label>
                        <textarea 
                            rows={10} 
                            className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[25px] text-sm leading-relaxed font-normal outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 transition-all resize-none break-words whitespace-pre-wrap shadow-inner" 
                            value={localManifest.auth.privacyContent} 
                            onChange={e => updateStudioField('auth', 'privacyContent', e.target.value)} 
                        />
                    </div>
                 </div>
               </div>
             )}

             {studioSection === 'NAV' && (
               <div className="space-y-12 animate-in fade-in duration-500">
                 <div>
                    <h4 className="text-2xl font-medium text-slate-900 tracking-tight">System Navigation Map</h4>
                    <p className="text-slate-400 text-sm mt-1">Customize the labels for major system hubs.</p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   {Object.keys(localManifest.navigation).map(key => (
                     <div key={key} className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{key} Identifier (Wraps)</label>
                       <textarea 
                            rows={1}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] text-sm font-bold outline-none resize-none break-words break-all whitespace-pre-wrap focus:bg-white focus:ring-1 focus:ring-slate-300 min-h-[56px]" 
                            value={(localManifest.navigation as any)[key]} 
                            onChange={e => updateStudioField('navigation', key, e.target.value)} 
                       />
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

const LogoPlaceholderIcon = () => (
  <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LoadingSpinnerIcon = () => (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LinkIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const ArrowUpRightIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

const ArrowDownLeftIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

export default ProfileSettings;
