"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Cloud, Key, Loader2 } from "lucide-react";
import { useRegister } from "@/hooks/use-auth";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).transform((d) => ({ ...d, confirmPassword: d.password }));

type FormData = { name: string; email: string; password: string };

export default function RegisterPage() {
  const register_ = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Name required"),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Minimum 6 characters"),
      })
    ),
  });

  const onSubmit = ({ email, password }: FormData) =>
    register_.mutate({ email, password });

  return (
    <div className="w-full max-w-[480px] z-10">
      <div
        className="bg-white w-full p-10 rounded-lg border border-border"
        style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" }}
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Join Nexus Enterprise for secure knowledge management.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg text-sm transition-all focus:outline-none focus:border-primary focus:border-2"
                {...register("name")}
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Work Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground" htmlFor="email">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg text-sm transition-all focus:outline-none focus:border-primary focus:border-2"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                className="w-full h-11 pl-10 pr-12 bg-background border border-border rounded-lg text-sm transition-all focus:outline-none focus:border-primary focus:border-2"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          {register_.error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded">
              {(register_.error as any)?.response?.data?.message || "Registration failed"}
            </p>
          )}

          <button
            type="submit"
            disabled={register_.isPending || !agreed}
            className="w-full h-12 bg-primary text-white font-semibold text-sm rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            {register_.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border" />
            <span className="mx-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              or continue with
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* SSO + Passkey */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 h-11 bg-background border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <Cloud className="w-4 h-4" /> SSO
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 h-11 bg-background border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <Key className="w-4 h-4" /> Passkey
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
