import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import {
  ArrowRight,
  Check,
  Sparkles,
  Layers,
  Wand2,
  CalendarClock,
  TrendingUp,
  Languages,
  Film,
} from 'lucide-react';

export const metadata = {
  title: 'Soshio — Social media posting, made effortless',
  description:
    'Generate AI posts, images, and reels for your clients and schedule them straight to Buffer for Instagram and Facebook.',
};

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading text-xl font-semibold tracking-tight text-deep-purple">
            Soshio
          </Link>
          <div className="hidden gap-6 sm:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-coral-mid">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-coral-mid">
              Pricing
            </a>
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
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24">
      <div className="absolute -top-32 -right-32 -z-10 size-[480px] rounded-full bg-coral-light/20 blur-[140px]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
          <div className="flex-1 lg:max-w-[60%]">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-coral-light/10 px-3 py-1 ring-1 ring-coral-light/20">
              <Sparkles className="size-3.5 shrink-0 text-coral-mid" />
              <span className="text-xs font-semibold tracking-wider text-coral-mid uppercase">
                Powered by AI
              </span>
            </div>
            <h1 className="text-balance font-heading text-5xl leading-[1.05] font-medium text-foreground md:text-7xl lg:max-w-[15ch]">
              Social media posting, made{' '}
              <span className="font-semibold text-coral-mid italic">effortless</span>
            </h1>
            <p className="mt-8 max-w-[48ch] text-pretty text-lg text-muted-foreground md:text-xl">
              Generate studio-quality posts, images, and high-engagement reels with AI. Schedule
              directly to Buffer for Instagram and Facebook in seconds.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-coral-mid py-3 pr-6 pl-5 text-base font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Get started free
                <ArrowRight className="size-4 shrink-0" />
              </Link>
              <a
                href="#pricing"
                className="px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View pricing →
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required</p>
          </div>

          <div className="relative flex-1 lg:max-w-[40%]">
            <div className="relative translate-y-4 rotate-2 transition-transform duration-700 hover:rotate-0">
              <Image
                src="/hero-post.jpg"
                alt="AI generated Instagram post preview"
                width={800}
                height={1000}
                className="aspect-[4/5] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-black/5"
              />
              <div className="absolute top-1/2 -left-8 w-52 -translate-y-1/2 -rotate-6 rounded-2xl bg-card p-4 shadow-xl ring-1 ring-black/5 md:-left-12">
                <div className="mb-3 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-coral-light" />
                  <div className="h-2 w-12 rounded-full bg-muted" />
                  <span className="ml-auto text-[9px] font-bold tracking-widest text-coral-mid uppercase">
                    Queued
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-muted" />
                  <div className="h-2 w-4/5 rounded-full bg-muted" />
                  <div className="h-2 w-3/5 rounded-full bg-muted" />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                  <CalendarClock className="size-3" />
                  Tomorrow · 9:00 AM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-muted py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 flex items-end justify-between gap-8">
          <div className="max-w-[56ch]">
            <span className="text-xs font-semibold tracking-widest text-coral-mid uppercase">
              Workflow
            </span>
            <h2 className="mt-3 font-heading text-4xl font-medium tracking-tight md:text-5xl">
              Everything you need to post smarter
            </h2>
          </div>
          <div className="hidden text-right lg:block">
            <span className="font-heading text-7xl font-medium text-coral-light/30">01</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Layers className="size-4" />}
            title="Multi-workspace"
            body="Manage multiple brands or client accounts from a single unified dashboard without switching logins."
          />

          <div className="relative overflow-hidden rounded-[20px] bg-deep-purple p-8 ring-1 ring-black/5 md:col-span-2">
            <div className="flex h-full flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-[35ch]">
                <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Wand2 className="size-4" />
                </div>
                <h3 className="mb-3 font-heading text-xl font-medium text-white">
                  AI-powered content
                </h3>
                <p className="text-pretty text-sm leading-relaxed text-white/70">
                  Stop staring at a blank screen. Our models generate context-aware captions,
                  hashtags, and visuals tailored to your brand voice.
                </p>
              </div>
              <Image
                src="/ai-interface.jpg"
                alt="AI generation interface"
                width={800}
                height={512}
                className="h-32 w-full rounded-xl object-cover ring-1 ring-white/10 lg:w-64"
              />
            </div>
          </div>

          <FeatureCard
            icon={<CalendarClock className="size-4" />}
            title="Buffer scheduling"
            body="Seamlessly push your approved posts directly to your Buffer queue for automated publishing."
            accent
          />
          <FeatureCard
            icon={<TrendingUp className="size-4" />}
            title="Trend-aware topics"
            body="Stay relevant with daily suggestions based on what's currently viral in your specific industry niche."
            tone="muted"
          />
          <FeatureCard
            icon={<Languages className="size-4" />}
            title="Multilingual EN/中文"
            body="Localize your global presence with perfect translations in English and Chinese, tailored for cultural nuance."
          />
          <FeatureCard
            icon={<Film className="size-4" />}
            title="AI video reels"
            body="Transform text prompts into short-form video content complete with transitions and AI-selected music."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  accent,
  tone = 'white',
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: boolean;
  tone?: 'white' | 'muted';
}) {
  const bg = tone === 'muted' ? 'bg-muted' : 'bg-card';
  return (
    <div className={`group relative overflow-hidden rounded-[20px] ${bg} p-8 ring-1 ring-black/5 transition-transform hover:-translate-y-1`}>
      <div
        className={`mb-6 flex size-10 items-center justify-center rounded-xl ${
          accent ? 'bg-coral-mid text-white' : 'bg-coral-light/10 text-coral-mid'
        }`}
      >
        {icon}
      </div>
      <h3 className={`mb-3 font-heading text-lg font-medium ${accent ? 'text-coral-dark' : ''}`}>
        {title}
      </h3>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="text-xs font-semibold tracking-widest text-coral-mid uppercase">
              Pricing
            </span>
            <h2 className="mt-3 text-balance font-heading text-4xl leading-tight font-medium md:text-5xl">
              Simple pricing for growing creators
            </h2>
            <p className="mt-6 max-w-[42ch] text-pretty text-muted-foreground">
              Start for free and scale as your audience grows. No hidden fees — just pure
              creativity.
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-7 sm:flex-row">
            <div className="flex-1 rounded-[24px] bg-card p-8 ring-1 ring-black/5">
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Free
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-medium tracking-tight">$0</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Forever free</p>
              <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
                {['1 workspace', '5 posts per month', 'AI post copy', 'Trend search'].map((f) => (
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
                Get started
              </Link>
            </div>

            <div className="relative flex-1 rounded-[24px] bg-coral-mid p-8 text-white shadow-2xl">
              <div className="absolute -top-3 right-8 rounded-full bg-deep-purple px-3 py-1 text-[10px] font-semibold tracking-wider uppercase">
                Most popular
              </div>
              <span className="text-xs font-semibold tracking-widest text-white/70 uppercase">
                Pro
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-medium tracking-tight">$29</span>
                <span className="text-sm text-white/70">/mo</span>
              </div>
              <p className="mt-2 text-sm text-white/70">Billed monthly</p>
              <ul className="mt-8 space-y-4 text-sm">
                {[
                  'Unlimited workspaces',
                  'Unlimited posts',
                  'AI images & video reels',
                  'Priority support',
                ].map((f) => (
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
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-[32px] bg-zinc-900 px-8 py-20 text-center">
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-heading text-4xl font-medium text-white md:text-5xl">
            Ready to reclaim your time?
          </h2>
          <p className="mt-4 text-zinc-400">
            Join the businesses already saving hours every week with Soshio.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-coral-mid py-3 pr-6 pl-5 text-base font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              Get started free
              <ArrowRight className="size-4" />
            </Link>
            <span className="text-sm text-zinc-500">No credit card required</span>
          </div>
        </div>
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-coral-mid/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-deep-purple/40 blur-[100px]" />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <span className="font-heading text-lg font-semibold tracking-tight text-deep-purple">
              Soshio
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Effortless social posting for creators.
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
        <div className="mt-12 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Soshio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
