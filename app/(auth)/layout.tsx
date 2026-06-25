export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {children}
    </div>
  );
}
