import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types/auth";
import { apiRequest } from "./api";

export const authService = {
  register(payload: RegisterRequest) {
    return apiRequest<AuthResponse | void>("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
      credentialsRequest: true,
    });
  },
  login(payload: LoginRequest) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
      credentialsRequest: true,
    });
  },
  logout() {
    return apiRequest<void>("/auth/logout", { method: "POST" });
  },
  me() {
    return apiRequest<User>("/auth/me");
  },
};