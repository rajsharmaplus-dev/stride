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
        <div className="gl-card overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-[#F05A28]/10">
                        <FileSpreadsheet size={14} className="text-[#F05A28]" />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest leading-none">Initiative Inventory</h2>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {filtered.length} of {totalCount || projects?.length || 0} Records {selectedIds.length > 0 && `· ${selectedIds.length} Selected`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F05A28] transition-colors" size={12} />
                        <input
                            type="text"
                            placeholder="Find records..."
                            className="input-compact !pl-9 !py-1.5 !text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="pl-6 pr-2 py-3 w-10">
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded border-slate-300 transition-colors cursor-pointer"
                                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                    onChange={handleSelectAll}
                                    style={{ accentColor: '#F05A28' }}
                                />
                            </th>
                            <th className="px-4 py-3">
                                <SortBtn label="Title" k="title" sortKey={sortKey} sortDir={sortDir} theme={theme} toggleSort={toggleSort} />
                            </th>
                            <th className="px-6 py-3">
                                <SortBtn label="Process" k="process" sortKey={sortKey} sortDir={sortDir} theme={theme} toggleSort={toggleSort} />
                            </th>
                            <th className="px-6 py-3">
                                <SortBtn label="Status" k="status" sortKey={sortKey} sortDir={sortDir} theme={theme} toggleSort={toggleSort} />
                            </th>
                            <th className="px-6 py-3">
                                <SortBtn label="Estimated ROI" k="estimatedBenefit" sortKey={sortKey} theme={theme} toggleSort={toggleSort} />
                            </th>
                            <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 text-right">
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
                                    className={`group transition-colors duration-75 ${isSelected ? 'bg-[#F05A28]/10' : 'hover:bg-slate-100/60'} cursor-pointer`}
                                    onClick={() => onSelectProject(project)}
                                >
                                    <td className="pl-6 pr-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer"
                                            checked={isSelected}
                                            onChange={(e) => toggleSelect(e, project?.id)}
                                            style={{ accentColor: '#F05A28' }}
                                        />
                                    </td>
                                    <td className="px-4 py-2.5 max-w-xs">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 text-[14px] truncate">
                                                {project?.title || 'Untitled'}
                                            </p>
                                            {isOwner && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEditProject(project); }}
                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-sm"
                                                >
                                                    <Edit2 size={10} className="text-[#F05A28]" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{project?.type || 'Standard'}</p>
                                    </td>
                                    <td className="px-6 py-2.5">
                                        <p className="text-[13px] font-bold text-slate-700">{project?.process || 'Operations'}</p>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{project?.methodology || 'Lean'}</p>
                                    </td>
                                    <td className="px-6 py-2.5">
                                        <StatusBadge status={project?.status} />
                                    </td>
                                    <td className="px-6 py-2.5">
                                        <p className="text-[14px] font-black text-slate-900">{formatCurrency(project?.estimatedBenefit)}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Calendar size={10} className="text-slate-400" />
                                            <p className="text-[11px] text-slate-500 font-bold uppercase">{project?.targetDate || 'Q4 2024'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-2.5 text-right">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 group-hover:text-[#F05A28]">
                                                <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Load More */}
            {projects.length < totalCount && (
                <div className="p-4 border-t border-slate-50 flex justify-center bg-slate-50/20">
                    <button
                        onClick={onLoadMore}
                        className="btn-secondary !rounded-full !px-6"
                    >
                        <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                        Load {totalCount - projects.length} More
                    </button>
                </div>
            )}
        </div>
    );
}

function SortBtn({ label, k, sortKey, theme, toggleSort }) {
    return (
        <button onClick={() => toggleSort(k)} className="flex items-center gap-1.5 group text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
            {label}
            <ArrowUpDown size={12} className={`${sortKey === k ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'} transition-opacity`} style={sortKey === k ? { color: '#F05A28' } : {}} />
        </button>
    );
}
