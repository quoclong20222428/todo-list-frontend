import axios from "axios";

// Lấy baseURL từ biến môi trường
const baseURL = import.meta.env.VITE_API_BASE_URL as string;

if (!baseURL) {
  console.warn("⚠️ VITE_API_BASE_URL is not defined in .env");
}

// Tạo instance axios
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});