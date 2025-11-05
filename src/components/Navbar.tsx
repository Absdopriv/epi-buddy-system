import { HardHat, Moon, Sun, LogIn, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SupportFAQ } from "@/components/SupportFAQ";

export const Navbar = () => {
  const [isDark, setIsDark] = useState(false);
  const empresaNome = "Sua Empresa";

  useEffect(() => {
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("darkMode", String(newTheme));
    document.documentElement.classList.toggle("dark");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-primary shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 text-primary-foreground">
            <HardHat className="h-6 w-6" />
            <h1 className="text-lg font-semibold">
              Gestão de EPI - <span className="font-normal">{empresaNome}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <SupportFAQ />
            <a href="https://grupo11projeto.sistemaeditoracapro.com.br/" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Site</span>
              </Button>
            </a>
            <Link to="/auth">
              <Button
                variant="outline"
                size="sm"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <LogIn className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Modo Escuro</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
