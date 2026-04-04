import { apiClient } from '../services/api';
import type { PendingFile } from '../types/qr';

export const uploadPendingFile = async (
  pendingFile: PendingFile,
  fileType: string
): Promise<{ url: string; publicId: string } | null> => {
  if (!pendingFile.file) return null;

  const formData = new FormData();
  formData.append('file', pendingFile.file);
  formData.append('fileType', fileType);

  try {
    const response = await apiClient.post<{ cloudinaryUrl: string; publicId: string }>(
      '/upload/file',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return { 
      url: response.data.cloudinaryUrl, 
      publicId: response.data.publicId 
    };
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
};

export const uploadAllPendingFiles = async (
  data: any
): Promise<any> => {
  const updatedData = { ...data };

  if (updatedData.image?.pendingFile) {
    const result = await uploadPendingFile(updatedData.image.pendingFile, 'image');
    if (result) {
      updatedData.image = { 
        url: result.url, 
        publicId: result.publicId,
        name: updatedData.image.name, 
        size: updatedData.image.size,
        caption: updatedData.image.caption
      };
    } else {
      delete updatedData.image;
    }
  }

  if (updatedData.video?.pendingFile) {
    const result = await uploadPendingFile(updatedData.video.pendingFile, 'video');
    if (result) {
      updatedData.video = { 
        ...updatedData.video, 
        url: result.url,
        publicId: result.publicId
      };
    }
    delete updatedData.video.pendingFile;
  }

  if (updatedData.pdf?.pendingFile) {
    const result = await uploadPendingFile(updatedData.pdf.pendingFile, 'pdf');
    if (result) {
      updatedData.pdf = { 
        url: result.url, 
        publicId: result.publicId,
        name: updatedData.pdf.name, 
        size: updatedData.pdf.size 
      };
    } else {
      delete updatedData.pdf;
    }
  }

  if (updatedData.mp3?.pendingFile) {
    const result = await uploadPendingFile(updatedData.mp3.pendingFile, 'audio');
    if (result) {
      updatedData.mp3 = { 
        url: result.url, 
        publicId: result.publicId,
        name: updatedData.mp3.name, 
        size: updatedData.mp3.size 
      };
    } else {
      delete updatedData.mp3;
    }
  }

  return updatedData;
};

export const getDownloadUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('cloudinary.com')) {
    // Force attachment for Cloudinary
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
};

export const downloadFile = async (url: string, fileName: string) => {
  const downloadUrl = getDownloadUrl(url);
  
  try {
    // Try fetch first for progress/better control if needed, 
    // but for Cloudinary fl_attachment is very reliable
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download failed:', err);
    // Fallback to direct link with fl_attachment
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    link.click();
  }
};
