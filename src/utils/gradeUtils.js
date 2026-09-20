// Shared helper functions for grade calculation and styling

export const calcGrade = (marks, total = 100) => {
  if (marks === null || marks === undefined || marks === "" || isNaN(marks)) {
    return 'ABS';
  }
  const numericMarks = Number(marks);
  const numericTotal = Number(total) || 100;
  const pct = (numericMarks / numericTotal) * 100;
  if (pct >= 75) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 55) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

export const gradeColor = (g) => {
  const map = {
    'A': { bg: '#F0FFF4', color: '#2F855A', border: '#9AE6B4' },
    'B': { bg: '#EBF4FF', color: '#2B6CB0', border: '#90CDF4' },
    'C': { bg: '#FEF3C7', color: '#B7860A', border: '#F6D860' },
    'D': { bg: '#FFF5F5', color: '#C53030', border: '#FEB2B2' },
    'F': { bg: '#FFF5F5', color: '#C53030', border: '#FEB2B2' },
    'ABS': { bg: '#F7FAFC', color: '#718096', border: '#E2E8F0' },
  };
  return map[g] || { bg: '#F7FAFC', color: '#718096', border: '#E2E8F0' };
};
