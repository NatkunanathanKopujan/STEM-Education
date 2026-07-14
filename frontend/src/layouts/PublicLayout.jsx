import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FiFacebook, FiLinkedin, FiMenu, FiTwitter, FiX } from 'react-icons/fi';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/Button';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Public navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-muted transition hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:block">
            <Link to="/login">
              <Button>Login</Button>
            </Link>
          </div>
          <button
            type="button"
            className="focus-ring rounded-xl p-2 text-muted hover:bg-orange-50 hover:text-primary md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <FiX className="size-6" /> : <FiMenu className="size-6" />}
          </button>
        </div>
        {mobileOpen ? (
          <div className="border-t border-line bg-white px-4 py-4 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-2" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-orange-50 hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button className="mt-2 w-full">Login</Button>
              </Link>
            </nav>
          </div>
        ) : null}
      </header>
      <div className="pt-16">
        <Outlet />
      </div>
      <footer id="contact" className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <BrandLogo />
            <p className="mt-4 text-sm leading-6 text-muted">
              AI Smart LMS helps universities manage teaching, learning, assessments,
              reports, and secure role-based access in one modern platform.
            </p>
            <div className="mt-5 flex gap-3">
              {[FiFacebook, FiTwitter, FiLinkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#home"
                  className="focus-ring grid size-10 place-items-center rounded-xl border border-line text-primary transition hover:border-primary hover:bg-orange-50"
                  aria-label="Social media"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Quick Links</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a className="transition hover:text-primary" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Support</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>
                <a className="transition hover:text-primary" href="#contact">
                  Help Center
                </a>
              </li>
              <li>
                <a className="transition hover:text-primary" href="#contact">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="transition hover:text-primary" href="#contact">
                  Terms
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Contact</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>Email: support@aismartlms.edu</li>
              <li>Phone: +1 555 014 8820</li>
              <li>AI Smart Learning Management System</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line px-4 py-5 text-center text-xs text-muted">
          Copyright 2026 AI Smart LMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
