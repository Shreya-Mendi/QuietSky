import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const analyzeAudio = async (audioBlob, mode) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('mode', mode);

  try {
    const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing audio:', error);
    throw error;
  }
};

export const testAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  try {
    const response = await axios.post(`${API_BASE_URL}/test-audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error testing audio:', error);
    throw error;
  }
};
