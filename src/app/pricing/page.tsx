import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export const metadata = { title: 'Pricing – Soshio' };

const FREE_FEATURES = [
  '1 workspace',
  '5 posts per month',
  'AI post copy generation',
  'Live trend search',
  'Multilingual translation',
  'Buffer scheduling',
];

const PRO_FEATURES = [
  'Unlimited workspaces',
  'Unlimited posts per month',
  'AI image generation',
  'AI video reel generation',
  'All Free features',
  'Priority support',
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-heading text-xl font-semibold tracking-tight text-deep-purple">
              Soshio
            </Link>
            <div className="hidden gap-6 sm:flex">
              <Link href="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-coral-mid">
                Features
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-coral-mid">
                Pricing
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline">
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-deep-purple py-2 pr-4 pl-3 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02]"
            >
              <Sparkles className="size-4 shrink-0" />
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 pt-32 pb-24">
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold tracking-widest text-coral-mid uppercase">Pricing</span>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight md:text-5xl">
            Simple pricing for growing creators
          </h1>
          <p className="mt-4 text-muted-foreground">
            Start for free and scale as your audience grows. No hidden fees.
          </p>
        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-[24px] bg-card p-8 ring-1 ring-black/5">
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Free</span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-heading text-5xl font-medium tracking-tight">$0</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Forever free — no credit card needed</p>
            <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4 text-muted-foreground/50" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-10 block w-full rounded-full bg-muted py-2.5 text-center text-sm font-medium ring-1 ring-black/5 transition-colors hover:bg-muted/70"
            >
              Get started free
            </Link>
          </div>

          <div className="relative rounded-[24px] bg-coral-mid p-8 text-white shadow-2xl">
            <div className="absolute -top-3 right-8 rounded-full bg-deep-purple px-3 py-1 text-[10px] font-semibold tracking-wider uppercase">
              Most popular
            </div>
            <span className="text-xs font-semibold tracking-widest text-white/70 uppercase">Pro</span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-heading text-5xl font-medium tracking-tight">$29</span>
              <span className="text-sm text-white/70">/mo</span>
            </div>
            <p className="mt-2 text-sm text-white/70">Cancel anytime</p>
            <ul className="mt-8 space-y-4 text-sm">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-10 block w-full rounded-full bg-white py-2.5 text-center text-sm font-medium text-coral-mid shadow-xl transition-transform active:scale-95"
            >
              Start free trial
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          All plans include Buffer scheduling and Tavily trend search.{' '}
          <Link href="/" className="text-coral-mid hover:underline">Back to home →</Link>
        </p>
      </div>
    </div>
  );
}
