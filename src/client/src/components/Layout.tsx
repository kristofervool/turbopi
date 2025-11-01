import { Link, useLocation } from 'react-router-dom';
import { Film, Library, Download, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Tailwind v4 uses prefers-color-scheme by default
    // We can still toggle manually if needed in future
  }, [darkMode]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Film className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">TurboPi</span>
            <span className="sm:hidden">TP</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex mx-8 gap-6">
            <Link to="/">
              <Button variant={isActive('/') ? 'default' : 'ghost'} size="sm">
                Search
              </Button>
            </Link>
            <Link to="/library">
              <Button variant={isActive('/library') ? 'default' : 'ghost'} size="sm">
                Library
              </Button>
            </Link>
            <Link to="/downloads">
              <Button variant={isActive('/downloads') ? 'default' : 'ghost'} size="sm">
                Downloads
              </Button>
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-3 h-16">
          <Link to="/" className="flex flex-col items-center justify-center gap-1">
            <Film className={`h-5 w-5 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Search
            </span>
          </Link>
          <Link to="/library" className="flex flex-col items-center justify-center gap-1">
            <Library className={`h-5 w-5 ${isActive('/library') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/library') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Library
            </span>
          </Link>
          <Link to="/downloads" className="flex flex-col items-center justify-center gap-1">
            <Download className={`h-5 w-5 ${isActive('/downloads') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/downloads') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Downloads
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
