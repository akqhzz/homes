'use client';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

type IconSvgProps = { className?: string };

export function PlaceholderLink({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <a
      href="#"
      onClick={(event) => event.preventDefault()}
      className={cn('no-underline transition-colors', className)}
    >
      {children}
    </a>
  );
}

export default function ListingsFooter({ fullWidth = false }: { fullWidth?: boolean }) {
  const companyLinks = ['Terms of Use', 'Privacy Policy', 'Careers', 'About Us', 'Accessibility'];
  const exploreLinks = ['Sitemap', 'US Real Estate Listings', 'Canada Real Estate Listings'];
  const legalCopy = [
    'The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by The Canadian Real Estate Association (CREA) and identify the quality of services provided by real estate professionals who are members of CREA.',
    'eXp Realty holds real estate brokerage licenses in multiple provinces. Zoocasa (Canada), Inc. holds real estate brokerage licenses in multiple provinces. For information on licenses please contact us at info@zoocasa.com.',
    'For listings in Canada, the trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by CREA and identify real estate professionals who are members of CREA.',
    'eXp Realty® is committed to adhering to the guidelines of The New York State Fair Housing Regulations. Fair Housing and Reasonable Accommodations. DMCA Notice.',
  ];
  const sectionTitleClass = cn('text-[var(--color-text-primary)]', fullWidth ? 'type-heading' : 'type-heading-sm');

  return (
    <footer className={cn(
      'mx-auto mb-6 mt-4 w-full rounded-[var(--radius-xl)] bg-[var(--color-surface)] px-4 pb-10 pt-8 text-[var(--color-text-primary)] sm:px-6',
      fullWidth ? 'max-w-none' : 'max-w-[1360px]'
    )}>
      <div className={cn('mx-auto w-full', fullWidth && 'max-w-[1180px]')}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
        <section>
          <h2 className={sectionTitleClass}>Company</h2>
          <ul className="mt-4 space-y-2.5">
            {companyLinks.map((link) => (
              <li key={link}>
                <PlaceholderLink className="inline-block max-w-full whitespace-normal break-normal type-caption text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">{link}</PlaceholderLink>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className={sectionTitleClass}>Explore</h2>
          <ul className="mt-4 space-y-2.5">
            {exploreLinks.map((link) => (
              <li key={link}>
                <PlaceholderLink className="inline-block w-max max-w-full whitespace-normal break-normal type-caption text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">{link}</PlaceholderLink>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className={sectionTitleClass}>Stay Connected</h2>
          <div className="mt-4 space-y-3 type-caption text-[var(--color-text-secondary)]">
            <p>1-844-683-4663</p>
            <p>INFO@ZOOCASA.COM</p>
            <p>52 Church St Suite 464<br />Toronto, ON M5C 2B5</p>
          </div>
          <div className="mt-4 flex gap-2">
            {SOCIAL_LINKS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-primary)] transition-colors hover:bg-white"
              >
                <Icon className={cn(label === 'X' ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]')} />
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className={sectionTitleClass}>Download Our App</h2>
          <div className="mt-4 flex flex-wrap gap-2 xl:flex-col">
            <StoreBadge store="apple" />
            <StoreBadge store="google" />
          </div>
        </section>
      </div>
      <div className="mt-10 border-t border-[var(--color-border)] pt-8">
        <div className="relative mx-auto mb-5 h-4 w-[116px]">
          <Image src="/icons/zoocasa-black.svg" alt="Zoocasa" fill sizes="116px" className="object-contain" />
        </div>
        <div className="mx-auto max-w-4xl space-y-2 text-center type-caption leading-relaxed text-[var(--color-text-secondary)]">
          <p>Owned by eXp Realty</p>
          <p>© 2026 eXp Realty. eXp World Holdings, Inc. All Rights Reserved</p>
          {legalCopy.map((copy) => (
            <p key={copy}>{copy}</p>
          ))}
        </div>
      </div>
      </div>
    </footer>
  );
}

const SOCIAL_LINKS = [
  { label: 'X', icon: XIcon },
  { label: 'Facebook', icon: FacebookIcon },
  { label: 'Instagram', icon: InstagramIcon },
  { label: 'LinkedIn', icon: LinkedInIcon },
] as const;

function StoreBadge({ store }: { store: 'apple' | 'google' }) {
  const isApple = store === 'apple';
  const Icon = isApple ? AppleIcon : GooglePlayIcon;

  return (
    <span className="inline-flex h-9 w-[8.6rem] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-2.5 text-[var(--color-text-primary)]">
      <Icon className={cn(isApple ? 'h-5 w-5' : 'h-5 w-4')} />
      <span className="flex flex-col leading-none">
        <span className="type-nano uppercase tracking-[0.02em]">
          {isApple ? 'Download on the' : 'Get it on'}
        </span>
        <span className="text-[0.8125rem] font-medium leading-[1.1] tracking-normal">
          {isApple ? 'App Store' : 'Google Play'}
        </span>
      </span>
    </span>
  );
}

function AppleIcon({ className }: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.7 12.6c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.6-.8-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.7 1.9-1 2.6-2c.8-1.2 1.2-2.3 1.2-2.4 0-.1-2.3-1-2.4-3.6ZM14.5 6.5c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.7-1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2Z" />
    </svg>
  );
}

function GooglePlayIcon({ className }: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#34A853" d="M4.4 3.2c-.3.3-.4.7-.4 1.2v15.2c0 .5.1.9.4 1.2l8.2-8.8-8.2-8.8Z" />
      <path fill="#FBBC04" d="m15.2 9.2-2.6 2.8 2.6 2.8 3.5-2c1.1-.6 1.1-1.1 0-1.7l-3.5-1.9Z" />
      <path fill="#4285F4" d="m4.4 3.2 10.8 6-2.6 2.8-8.2-8.8Z" />
      <path fill="#EA4335" d="m4.4 20.8 8.2-8.8 2.6 2.8-10.8 6Z" />
    </svg>
  );
}

function XIcon({ className }: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14.4 10.5 22.2 1.5h-1.9l-6.7 7.8-5.4-7.8H2l8.2 11.9L2 22.9h1.9l7.1-8.3 5.7 8.3H23l-8.6-12.4Zm-2.5 2.9-.8-1.2-6.6-9.3h2.8l5.3 7.6.8 1.2 7 9.9h-2.8l-5.7-8.2Z" />
    </svg>
  );
}

function FacebookIcon({ className }: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M15.6 8.1h-2V6.8c0-.5.3-.6.6-.6h1.3V3.8h-1.8c-2 0-3.1 1.2-3.1 3.3v1H8.7v2.5h1.9v6.7h3v-6.7h1.7l.3-2.5Z" />
    </svg>
  );
}

function InstagramIcon({ className }: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedInIcon({ className }: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M6.8 8.9H4.2v8.4h2.6V8.9ZM5.5 7.7c.8 0 1.5-.7 1.5-1.5S6.3 4.8 5.5 4.8 4 5.4 4 6.2s.7 1.5 1.5 1.5ZM17.3 17.3h2.6v-4.6c0-2.4-1.3-3.6-3.1-3.6-1.4 0-2 .8-2.4 1.3V8.9h-2.5v8.4h2.6v-4.2c0-1.1.2-2.2 1.6-2.2s1.3 1.3 1.3 2.2v4.2Z" />
    </svg>
  );
}
