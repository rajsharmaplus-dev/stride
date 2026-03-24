import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, FileSpreadsheet, X, ArrowUpDown, Calendar, Tag, Edit2, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../Common';
import { formatCurrency } from '../../utils/format';

export function ProjectTable({ projects, totalCount, onLoadMore, onSelectProject, onEditProject, onSelectionChange, selectedIds = [], theme, currentUser }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const filtered = useMemo(() => {
        const items = projects || [];
        if (!searchTerm) return [...items];
        
        const searchLower = searchTerm.toLowerCase();
        return items.filter(p =>
            (p?.title || '').toLowerCase().includes(searchLower) ||
            (p?.process || '').toLowerCase().includes(searchLower) ||
            (p?.type || '').toLowerCase().includes(searchLower) ||
            (p?.methodology || '').toLowerCase().includes(searchLower) ||
            (p?.status || '').toLowerCase().includes(searchLower)
        );
    }, [projects, searchTerm]);

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filtered.map(p => p?.id);
            onSelectionChange?.(allIds);
        } else {
            onSelectionChange?.([]);
        }
    };

    const toggleSelect = (e, id) => {
        e.stopPropagation();
        let next;
        if (selectedIds.includes(id)) {
            next = selectedIds.filter(i => i !== id);
        } else {
            next = [...selectedIds, id];
        }
        onSelectionChange?.(next);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: theme?.accentMuted || '#f1f5f9' }}>
                        <FileSpreadsheet size={16} style={{ color: theme?.accent || '#64748b' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800 tracking-tight">Project Portfolio</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {filtered.length} of {totalCount || projects?.length || 0} records {selectedIds.length > 0 && `· ${selectedIds.length} selected`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-500 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search initiatives..."
                            className="pl-9 pr-9 py-2.5 bg-slate-50 border border-transparent rounded-xl w-full focus:ring-2 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-slate-200"
                            style={{ ['--tw-ring-color']: theme?.accentMuted }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto relative">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/60 border-b border-slate-100">
                            <th className="pl-6 pr-2 py-3.5 w-10">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                        onChange={handleSelectAll}
                                        style={{ accentColor: theme?.accent }}
                                    />
                                </div>
                            </th>
                            <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                <SortBtn label="Initiative" k="title" sortKey={sortKey} sortDir={sortDir} theme={theme} toggleSort={toggleSort} />
                            </th>
                            <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                <SortBtn label="Governance" k="process" sortKey={sortKey} sortDir={sortDir} theme={theme} toggleSort={toggleSort} />
                            </th>
                            <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                <SortBtn label="Status" k="status" sortKey={sortKey} sortDir={sortDir} theme={theme} toggleSort={toggleSort} />
                            </th>
                            <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                <SortBtn label="Est. Value" k="estimatedBenefit" sortKey={sortKey} theme={theme} toggleSort={toggleSort} />
                            </th>
                            <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(project => {
                            const isSelected = selectedIds.includes(project?.id);
                            const isOwner = project?.submitterId === currentUser?.id;

                            return (
                                <tr
                                    key={project?.id}
                                    className={`group transition-all duration-150 ${isSelected ? 'bg-slate-50/90' : 'hover:bg-slate-50/50'} cursor-pointer`}
                                    onClick={() => onSelectProject(project)}
                                >
                                    <td className="pl-6 pr-2 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 focus:ring-offset-0 cursor-pointer transition-transform active:scale-90"
                                            checked={isSelected}
                                            onChange={(e) => toggleSelect(e, project?.id)}
                                            style={{ accentColor: theme?.accent }}
                                        />
                                    </td>
                                    <td className="px-4 py-4 max-w-xs">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 text-sm truncate group-hover:text-slate-700 transition-colors">
                                                {project?.title || 'Untitled'}
                                            </p>
                                            {isOwner && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEditProject(project); }}
                                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white hover:shadow-sm transition-all"
                                                    title="Edit Project"
                                                >
                                                    <Edit2 size={12} style={{ color: theme?.accent }} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Tag size={9} className="text-slate-300" />
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{project?.type || '—'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-slate-700">{project?.process || '—'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{project?.methodology || '—'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={project?.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900">{formatCurrency(project?.estimatedBenefit)}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Calendar size={9} className="text-slate-300" />
                                            <p className="text-[10px] text-slate-400 font-bold">{project?.targetDate || '—'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-indigo-600 transition-all group-hover:translate-x-1">
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                            <Search size={24} className="text-slate-200" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-400">
                                {searchTerm ? `No results for "${searchTerm}"` : 'No records found'}
                            </p>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-xs font-bold mt-2 hover:underline" style={{ color: theme?.accent }}>
                                    Clear search
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination / Load More */}
            {projects.length < totalCount && (
                <div className="p-6 border-t border-slate-50 flex justify-center bg-slate-50/30">
                    <button
                        onClick={onLoadMore}
                        className="group flex items-center gap-3 px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:shadow-xl shadow-slate-200/50 transition-all active:scale-95"
                    >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        Load More Results
                        <span className="text-slate-300 lowercase font-bold tracking-tight">({projects.length} of {totalCount})</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function SortBtn({ label, k, sortKey, theme, toggleSort }) {
    return (
        <button onClick={() => toggleSort(k)} className="flex items-center gap-1 group hover:text-slate-700 transition-colors">
            {label}
            <ArrowUpDown size={10} className={`${sortKey === k ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'} transition-opacity`} style={sortKey === k ? { color: theme?.accent } : {}} />
        </button>
    );
}
