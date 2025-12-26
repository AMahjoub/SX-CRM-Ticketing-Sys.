import React, { useMemo, useState } from 'react';
import type { User, SystemManifest, ViewType, CrudPermissions } from '../types';
import { UserRole, AccountStatus } from '../types';

interface AdminManagementProps {
  staffMembers: User[];
  onAddStaff: (staff: User) => void;
  onDelete: (id: string) => void;
  onEditStaff: (id: string) => void;
  manifest: SystemManifest;
}

type NewStaffForm = {
  name: string;
  email: string;
  role: UserRole;
};

const DEFAULT_PERMISSIONS: ViewType[] = ['DASHBOARD'];

const AdminManagement: React.FC<AdminManagementProps> = ({
  staffMembers,
  onAddStaff,
  onDelete,
  onEditStaff,
  manifest
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newStaff, setNewStaff] = useState<NewStaffForm>({
    name: '',
    email: '',
    role: UserRole.STAFF
  });

  const primaryColor = useMemo(
    () => manifest?.global?.primaryColor || '#0f172a',
    [manifest]
  );

  const closeModal = () => {
    setIsAddModalOpen(false);
    setNewStaff({ name: '', email: '', role: UserRole.STAFF });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();

    const staff: User = {
      id: `u-${Date.now()}`,
      name: newStaff.name.trim(),
      email: newStaff.email.trim().toLowerCase(),
      role: newStaff.role,
      status: AccountStatus.APPROVED,
      avatar: `https://picsum.photos/seed/${encodeURIComponent(newStaff.email)}/100/100`,
      permissions: DEFAULT_PERMISSIONS,
      crudPermissions: {} as Partial<Record<ViewType, CrudPermissions>>,
      projectAccess: 'ALL'
    };

    onAddStaff(staff);
    closeModal();
  };

  const formatPermissionLabel = (p: string) => {
    return p.replace(/_/g, ' ');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">
            Team Management
          </h2>
          <p className="text-slate-500 font-normal break-words">
            Provision and manage administrative staff and access tiers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-8 py-3 text-white rounded-[10px] font-medium shadow-md transition-all hover:brightness-110 shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          Provision New Staff
        </button>
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-normal border-collapse">
            <thead className="bg-slate-50 text-[10px] font-medium uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Identity</th>
                <th className="px-8 py-6">Access Tier</th>
                <th className="px-8 py-6">Module Permissions</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {staffMembers.map((m) => {
                const perms = m.permissions ?? [];
                const permsCount = perms.length;

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={m.avatar || 'https://picsum.photos/seed/default/100/100'}
                          className="w-10 h-10 rounded-[10px] object-cover border border-slate-100 shadow-sm shrink-0"
                          alt=""
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 text-sm tracking-tight break-words">
                            {m.name}
                          </p>
                          <p className="text-xs text-slate-400 break-all">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded-[5px] border ${
                          m.role === UserRole.ADMIN
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1">
                        {perms.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100 uppercase font-bold break-words"
                          >
                            {formatPermissionLabel(p)}
                          </span>
                        ))}

                        {permsCount > 3 && (
                          <span className="text-[9px] text-slate-300 font-bold whitespace-nowrap">
                            +{permsCount - 3} MORE
                          </span>
                        )}

                        {permsCount === 0 && (
                          <span className="text-[9px] text-rose-300 font-bold uppercase">
                            No Access
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-4 shrink-0">
                        <button
                          onClick={() => onEditStaff(m.id)}
                          className="text-slate-600 text-[10px] font-bold uppercase hover:underline"
                        >
                          Edit Profile
                        </button>

                        {m.id !== 'u-admin' && (
                          <button
                            onClick={() => onDelete(m.id)}
                            className="text-rose-600 text-[10px] font-bold uppercase hover:underline"
                          >
                            Revoke Access
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[15px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <form onSubmit={handleAdd}>
              <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                <h3 className="text-2xl font-bold text-slate-900">
                  Provision Team Member
                </h3>
              </div>

              <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Identity Name (Wraps)
                  </label>
                  <textarea
                    required
                    rows={1}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[12px] outline-none resize-none break-words whitespace-pre-wrap font-normal"
                    value={newStaff.name}
                    onChange={(e) =>
                      setNewStaff((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Registry Email
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[12px] outline-none break-all"
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Initial Access Tier
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[12px] outline-none appearance-none cursor-pointer"
                    value={newStaff.role}
                    onChange={(e) =>
                      setNewStaff((prev) => ({
                        ...prev,
                        role: e.target.value as UserRole
                      }))
                    }
                  >
                    <option value={UserRole.STAFF}>Support Staff</option>
                    <option value={UserRole.ADMIN}>Platform Administrator</option>
                  </select>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-4 font-bold text-slate-400 uppercase text-[10px]"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-white font-bold rounded-[10px] uppercase text-[10px] shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Initialize Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;