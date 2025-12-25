
import React, { useState, useRef, useMemo } from 'react';
import { Ticket, TicketStatus, TicketPriority, SystemManifest, Attachment } from '../types';
import { generateTicketSummary } from '../services/geminiService';

interface TicketSystemProps {
  tickets: Ticket[];
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onReply: (id: string, text: string, attachments?: Attachment[]) => void;
  manifest: SystemManifest;
}

const TicketSystem: React.FC<TicketSystemProps> = ({ tickets, onUpdateStatus, onReply, manifest }) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState<Attachment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTickets = useMemo(() => {
    if (!searchTerm.trim()) return tickets;
    const term = searchTerm.toLowerCase();
    return tickets.filter(t => 
      t.subject.toLowerCase().includes(term) || 
      t.clientName.toLowerCase().includes(term) || 
      t.clientCompany?.toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term)
    );
  }, [tickets, searchTerm]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Added explicit type cast to File to ensure correct property access
    const attachments: Attachment[] = Array.from(files).map((file: File) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));

    setReplyFiles(prev => [...prev, ...attachments]);
  };

  const removeFile = (index: number) => {
    setReplyFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = () => {
    if ((!replyText.trim() && replyFiles.length === 0) || !selectedTicketId) return;
    onReply(selectedTicketId, replyText, replyFiles);
    setReplyText('');
    setReplyFiles([]);
  };

  const handleAiSummary = async () => {
    if (!selectedTicket) return;
    setIsAiProcessing(true);
    const summary = await generateTicketSummary(selectedTicket);
    alert(`Ticket Intelligent Summary:\n\n${summary}`);
    setIsAiProcessing(false);
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case TicketPriority.URGENT: return 'bg-rose-100 text-rose-700';
      case TicketPriority.HIGH: return 'bg-orange-100 text-orange-700';
      case TicketPriority.MEDIUM: return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden animate-in slide-in-from-right-4 duration-500 font-sans font-normal">
      <div className="w-full lg:w-96 border-r border-slate-200 bg-white flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-medium text-slate-900 uppercase tracking-widest text-xs">Support Queue</h3>
        </div>
        
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Filter node queue..."
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-[10px] text-xs outline-none transition-all font-normal focus:ring-1 focus:ring-slate-400 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => { setSelectedTicketId(ticket.id); }}
              className={`w-full p-6 border-b border-slate-100 text-left hover:bg-slate-50 transition-all ${selectedTicketId === ticket.id ? 'bg-slate-50 border-l-4 shadow-inner' : ''}`}
              style={selectedTicketId === ticket.id ? { borderLeftColor: manifest.global.primaryColor } : {}}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{ticket.id}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase ${getPriorityBadge(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <p className="font-bold text-slate-900 text-sm truncate leading-tight">{ticket.subject}</p>
              <div className="mt-2 flex flex-col gap-0.5">
                 <p className="text-[10px] text-slate-900 font-bold uppercase tracking-tight">{ticket.clientName}</p>
                 <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">{ticket.clientCompany || 'Independent'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
        {selectedTicket ? (
          <>
            <div className="p-8 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-4 mt-1.5">
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Client: {selectedTicket.clientName} | {selectedTicket.clientCompany}</p>
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ticket: {selectedTicket.id}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    disabled={isAiProcessing}
                    onClick={handleAiSummary}
                    className="px-5 py-2 bg-slate-100 text-slate-600 rounded-[10px] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all"
                  >
                    <SummaryIcon /> Summary
                  </button>
                </div>
              </div>
              <select 
                className="bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-[12px] px-6 py-2.5 outline-none appearance-none cursor-pointer shadow-sm"
                value={selectedTicket.status}
                onChange={(e) => onUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)}
              >
                {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {selectedTicket.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[70%] rounded-[22px] p-7 shadow-sm ${msg.isAdmin ? 'text-white' : 'bg-white border border-slate-200 text-slate-800'}`}
                    style={msg.isAdmin ? { backgroundColor: manifest.global.primaryColor } : {}}
                  >
                    <div className="flex justify-between items-center mb-3.5 gap-8">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{msg.senderName}</span>
                      <span className="text-[8px] opacity-40 uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-normal leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-black/5 space-y-2">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 bg-black/5 rounded-[15px] group border border-transparent hover:border-black/10 transition-all">
                             <div className="flex items-center gap-3">
                                <FileIconSmall />
                                <span className="text-[10px] font-bold truncate max-w-[200px]">{att.name}</span>
                             </div>
                             <a href={att.url} download={att.name} className="p-2 hover:bg-black/10 rounded-full transition-all text-current"><DownloadIconSmall /></a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-white border-t border-slate-200 shrink-0 shadow-2xl">
              <div className="max-w-4xl mx-auto flex flex-col gap-4">
                {replyFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
                    {replyFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-full">
                         <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{f.name}</span>
                         <button onClick={() => removeFile(i)} className="text-rose-500 hover:text-rose-700 p-0.5"><CloseIconSmall /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <textarea 
                    rows={3}
                    placeholder="Communicate with client node..."
                    className="w-full p-7 pr-16 bg-white border border-slate-200 rounded-[20px] text-sm outline-none transition-all resize-none font-normal shadow-inner focus:border-slate-300 focus:ring-1 focus:ring-slate-100"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-7 top-1/2 -translate-y-1/2 p-3 text-slate-300 hover:text-slate-600 transition-all active:scale-90"
                  >
                    <PaperClipIcon />
                  </button>
                  <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  {isAiProcessing && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-[20px]">
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce [animation-delay:-0.3s]"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce [animation-delay:-0.15s]"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleSendReply} 
                    className="px-14 py-4 text-white rounded-[15px] font-bold shadow-xl transition-all hover:brightness-110 uppercase text-[10px] tracking-[0.2em] active:scale-95"
                    style={{ backgroundColor: manifest.global.primaryColor }}
                  >
                    Transmit Response
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6">
             <div className="p-8 bg-slate-100 rounded-full opacity-40"><TicketIconLarge /></div>
             <p className="font-bold uppercase tracking-[0.4em] text-[10px]">Select a node from the registry queue</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const TicketIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const FileIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const DownloadIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const CloseIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;

export default TicketSystem;
