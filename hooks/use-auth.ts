"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { setStoredAuth, clearStoredAuth, getStoredUser } from "@/lib/auth";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return { user, isLoading };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setStoredAuth(data.token, data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
      router.push("/drive");
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setStoredAuth(data.token, data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
      router.push("/drive");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    clearStoredAuth();
    queryClient.clear();
    router.push("/login");
  };
}
