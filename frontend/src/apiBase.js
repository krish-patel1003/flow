const PROD_BACKEND_FALLBACK = 'https://flow-backend-service-u5ardqzxja-uc.a.run.app';

export const getApiBase = () => {
  const configured = process.env.REACT_APP_API_BASE;
  if (configured && configured.trim()) {
    return configured.trim();
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isLocal) {
      return 'http://127.0.0.1:8000';
    }
  }

  return PROD_BACKEND_FALLBACK;
};
