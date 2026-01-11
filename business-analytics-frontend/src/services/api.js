import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const signup = (data) => API.post("/signup", data);
export const login = (data) => API.post("/login", data);
export const uploadCSV = (email, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post(`/upload-csv?user_email=${email}`, formData);
};

export const getDatasets = (email) =>
  API.get(`/datasets?user_email=${email}`);

export const askQuestion = (payload) =>
  API.post("/ask", payload);
