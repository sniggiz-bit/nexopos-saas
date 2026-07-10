import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface PublicInfoPageProps {
  title: string;
  children: React.ReactNode;
}

export function PublicInfoPage({ title, children }: PublicInfoPageProps) {
  return (
    <div className="min-h-screen bg-[#070913] flex flex-col text-slate-300">
      <header className="border-b border-white/[0.05] bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-400 hidden sm:block">Volver al inicio</span>
          </Link>
          <Logo variant="full" className="h-7 w-auto brightness-0 invert" />
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-8 md:mb-12 tracking-tight">{title}</h1>
        <div className="prose prose-invert prose-slate max-w-none">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/[0.05] py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NexoPOS. Todos los derechos reservados.
      </footer>
    </div>
  );
}
