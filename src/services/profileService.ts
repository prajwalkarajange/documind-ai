import type { User } from "@/types/auth";
import { apiRequest } from "./api";

export const profileService = {
  get() {
    return apiRequest<User>("/profile");
  },
  update(payload: { name: string }) {
    return apiRequest<User>("/profile", { method: "PUT", body: payload });
  },
};