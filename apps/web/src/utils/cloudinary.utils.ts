/**
 * Utility function to transform the Cloudinary secure_url by injecting 
 * the fl_attachment transformation flag immediately after the /upload/ segment.
 */
export const getDownloadUrl = (secureUrl: string): string => {
  if (!secureUrl || !secureUrl.includes('/upload/')) return secureUrl;
  
  const parts = secureUrl.split('/upload/');
  return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
};

/**
 * Utility to determine if a URL is a Cloudinary URL.
 */
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com');
};
