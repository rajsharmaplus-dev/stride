import xss from 'xss';

export const VALID_STATUSES     = ['Draft', 'Pending Approval', 'Pending Rework', 'Active', 'Declined', 'Closed'];
export const VALID_PROCESSES    = ['Sales', 'HR', 'Finance', 'Operations', 'IT', 'Supply Chain'];
export const VALID_TYPES        = ['Cost Reduction', 'Revenue Generation', 'Compliance', 'Quality Improvement', 'Process Efficiency'];
export const VALID_METHODOLOGIES = ['Six Sigma', 'Lean', 'Agile', 'Waterfall', 'Quick Win'];

export function sanitize(text) {
    if (typeof text !== 'string') return text;
    return xss(text);
}

export function validateProject(p) {
    const errors = [];
    if (p.status      && !VALID_STATUSES.includes(p.status))           errors.push(`Invalid status: ${p.status}`);
    if (p.process     && !VALID_PROCESSES.includes(p.process))         errors.push(`Invalid process: ${p.process}`);
    if (p.type        && !VALID_TYPES.includes(p.type))                errors.push(`Invalid type: ${p.type}`);
    if (p.methodology && !VALID_METHODOLOGIES.includes(p.methodology)) errors.push(`Invalid methodology: ${p.methodology}`);

    if (p.estimatedBenefit !== undefined &&
        (isNaN(p.estimatedBenefit) || parseFloat(p.estimatedBenefit) < 0)) {
        errors.push('Estimated benefit must be a non-negative number');
    }
    if (p.actualInvestment !== undefined && p.actualInvestment !== null &&
        (isNaN(p.actualInvestment) || parseFloat(p.actualInvestment) < 0)) {
        errors.push('Actual investment must be a non-negative number');
    }
    if (p.actualRoi !== undefined && p.actualRoi !== null &&
        (isNaN(p.actualRoi) || parseFloat(p.actualRoi) < 0)) {
        errors.push('Actual ROI must be a non-negative number');
    }

    return errors;
}
