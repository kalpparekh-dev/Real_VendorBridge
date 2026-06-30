import api from './axios';

export const downloadExecutiveReportPdf = async () => {
  const response = await api.get('/executive-report/pdf', {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'vendorbridge-executive-report.pdf';
  link.click();

  window.URL.revokeObjectURL(url);
};