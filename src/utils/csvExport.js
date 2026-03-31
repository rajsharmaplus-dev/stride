/**
 * Converts an array of project objects into a CSV string and triggers a browser download.
 * @param {Array} projects - Array of project objects to export
 */
export function exportProjectsToCSV(projects) {
    if (!projects || projects.length === 0) return;

    // Define headers - matching the database/model fields
    const headers = [
        'ID', 'Title', 'Status', 'Process', 'Type', 'Methodology', 
        'Summary', 'Estimated Benefit ($)', 'Actual Investment ($)', 
        'Actual ROI ($)', 'Target Date', 'Created At', 'Doc Link'
    ];

    // Map projects to rows
    const rows = projects.map(p => [
        p?.id || '',
        `"${(p?.title || '').replace(/"/g, '""')}"`, // Escape quotes
        p.status,
        p.process || '',
        p.type || '',
        p.methodology || '',
        `"${(p.summary || '').replace(/"/g, '""')}"`,
        p.estimatedBenefit || 0,
        p.actualInvestment || '',
        p.actualRoi || '',
        p.targetDate || '',
        p.createdAt || '',
        p.docLink || ''
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `stride_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
