export const formatCategory = (cat: string | null | undefined): string => {
  if (!cat) return 'General Incident';
  const map: Record<string, string> = {
    'CYBER_CRIME': 'Cyber Crime / Unauthorized Breach',
    'FRAUD': 'Financial Fraud / Identity Theft',
    'THEFT': 'Theft / Stolen Property',
    'HARASSMENT': 'Online Harassment / Extortion',
    'DATA_THEFT': 'Data Leak / IP Compromise',
    'THREAT': 'Threat / Cyberstalking',
    'OTHER': 'Other Incident'
  };
  return map[cat] || cat;
};

export const INCIDENT_CATEGORIES = [
  { value: 'CYBER_CRIME', label: 'Cyber Crime / Unauthorized Breach' },
  { value: 'FRAUD', label: 'Financial Fraud / Identity Theft' },
  { value: 'THEFT', label: 'Theft / Stolen Property' },
  { value: 'HARASSMENT', label: 'Online Harassment / Extortion' },
  { value: 'DATA_THEFT', label: 'Data Leak / IP Compromise' },
  { value: 'THREAT', label: 'Threat / Cyberstalking' },
  { value: 'OTHER', label: 'Other Incident' }
];
