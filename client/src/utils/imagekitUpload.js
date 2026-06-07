import axios from 'axios';
import api from '../config/api.js';

export const uploadToImageKit = async ({
  file,
  folder = '/skillsphere',
  onUploadProgress,
}) => {
  const { data: auth } = await api.get('/upload/signature');

  const uploadData = new FormData();
  uploadData.append('file', file);
  uploadData.append(
    'fileName',
    `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
  );
  uploadData.append('publicKey', auth.publicKey);
  uploadData.append('signature', auth.signature);
  uploadData.append('expire', auth.expire);
  uploadData.append('token', auth.token);
  uploadData.append('folder', folder);
  uploadData.append('useUniqueFileName', 'true');

  const response = await axios.post(
    'https://upload.imagekit.io/api/v1/files/upload',
    uploadData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }
  );

  return response.data;
};
