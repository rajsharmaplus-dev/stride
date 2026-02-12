import React, { useState } from 'react';
import { Search, ChevronRight, FileSpreadsheet, Download, X } from 'lucide-react';
import { StatusBadge, formatCurrency } from '../Common';

export function ProjectTable({ projects, onSelectProject }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Edge case T-14: search now covers title, process, type, methodology, and status
    const searchLower = searchTerm.toLowerCase();
    const filtered = searchTerm
        ? projects.filter(p =>
            (p.title || '').toLowerCase().includes(searchLower) ||
            (p.process || '').toLowerCase().includes(searchLower) ||
            (p.type || '').toLowerCase().includes(searchLower) ||
            (p.methodology || '').toLowerCase().includes(searchLower) ||
            (p.status || '').toLowerCase().includes(searchLower)
        )
        : projects;

    return (
        <div className="glass-card rounded-2xl overflow-hidden border-none shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-50 p-2 rounded-lg">
                        <FileSpreadsheet size={18} className="text-primary-600" />
                    </div>
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">Project Portfolio</h2>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{filtered.length} of {projects.length}</span>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={15} />
                        <input
                            type="text"
                            placeholder="Search by title, process, type, status..."
                            className="pl-9 pr-9 py-2 bg-slate-50 border-none rounded-xl w-full focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {/* Clear button for search */}
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            const csvHeader = 'Title,Process,Type,Methodology,Status,Estimated Benefit\n';
                            const csvRows = projects.map(p =>
                                `"${p.title}","${p.process}","${p.type}","${p.methodology}","${p.status}","${p.estimatedBenefit}"`
                            ).join('\n');
                            const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'project_portfolio.csv';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="p-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors border border-primary-100"
                        title="Export as CSV"
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Initiative Detail</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Governance</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Status</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Estimated Value</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(project => (
                            <tr
                                key={project.id}
                                className="hover:bg-slate-50/80 cursor-pointer transition-all duration-200 group"
                                onClick={() => onSelectProject(project)}
                            >
                                <td className="px-8 py-5 max-w-xs">
                                    {/* Edge case T-12: long titles truncate gracefully */}
                                    <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors text-sm truncate">{project.title || 'Untitled'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{project.type || '—'}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">{project.process || '—'}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{project.methodology || '—'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <StatusBadge status={project.status} />
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        {/* Edge case T-11/E-20: safe currency formatting */}
                                        <span className="text-sm font-black text-slate-900">{formatCurrency(project.estimatedBenefit)}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Annual Baseline</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="inline-flex items-center gap-1.5 text-primary-600 font-black text-[10px] uppercase tracking-widest hover:gap-2.5 transition-all">
                                        View Record <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-300 gap-3">
                        <Search size={48} className="opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest italic opacity-40">
                            {searchTerm ? `No results for "${searchTerm}"` : 'No records found matching your baseline'}
                        </p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-xs text-primary-500 font-bold hover:underline">
                                Clear search
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
