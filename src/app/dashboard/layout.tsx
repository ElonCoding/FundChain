/**
 * Dashboard layout — enforces full-height overflow-hidden
 * so the chat/fund panels work correctly as a fixed-height shell.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  );
}
