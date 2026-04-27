import React from 'react';
import { PROJECT_STATUS } from '../../constants/projectConstants';

const STATUS_STYLES = {
    [PROJECT_STATUS.DRAFT]:    'bg-slate-50 text-slate-500 border-slate-200',
    [PROJECT_STATUS.PENDING]:  'bg-amber-50 text-amber-600 border-amber-100',
    [PROJECT_STATUS.REWORK]:   'bg-orange-50 text-orange-600 border-orange-100',
    [PROJECT_STATUS.ACTIVE]:   'bg-emerald-50 text-emerald-600 border-emerald-100',
    [PROJECT_STATUS.DECLINED]: 'bg-red-50 text-red-600 border-red-100',
    [PROJECT_STATUS.CLOSED]:   'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_DOT = {
    [PROJECT_STATUS.DRAFT]:    'bg-slate-300',
    [PROJECT_STATUS.PENDING]:  'bg-amber-400',
    [PROJECT_STATUS.REWORK]:   'bg-orange-400',
    [PROJECT_STATUS.ACTIVE]:   'bg-emerald-400',
    [PROJECT_STATUS.DECLINED]: 'bg-red-400',
    [PROJECT_STATUS.CLOSED]:   'bg-slate-400',
};

export function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest border transition-colors ${STATUS_STYLES[status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-slate-300'}`} />
            {status || 'Unknown'}
        </span>
    );
}
