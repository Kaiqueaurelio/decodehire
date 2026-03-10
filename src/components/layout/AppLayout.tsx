import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { BarChart3, CreditCard, LogOut, Shield, Menu, X, User, Info, FileText as FileTextIcon, Sun, Moon } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/logo.jpeg";

const navItems = [
  { to: "/dashboard", icon: FileTextIcon, label: "Análise" },
  { to: "/history", icon: BarChart3, label: "Histórico" },
  { to: "/plans", icon: CreditCard, label: "Planos" },
  { to: "/profile", icon: User, label: "Perfil" },
];

export default function AppLayout() {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="Decode Analytics" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-display font-bold text-lg text-sidebar-primary-foreground">
              Decode Analytics
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-3 px-3">Menu</p>
          {navItems.filter(item => !(isAdmin && item.to === "/plans")).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === item.to
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="mt-6 mb-2 px-3">
                <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-3">Admin</p>
              </div>
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Shield className="w-4 h-4" />
                Painel Admin
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 mb-3 px-3 truncate">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="Decode Analytics" className="w-7 h-7 rounded-md object-cover" />
            <span className="font-display font-bold">Decode Analytics</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border space-y-1">
          <div className="flex justify-center gap-3">
            <Link to="/about" className="hover:text-primary transition-colors">Sobre nós</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Termos de uso</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-primary transition-colors">Contato</Link>
          </div>
          <p>© 2026 Decode Analytics — Criado por Kaique Aurélio</p>
        </footer>
      </div>
    </div>
  );
}
