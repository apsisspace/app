import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { SiteNav, SiteFooter, PageShell } from '../components/SiteChrome'

const CANONICAL = 'https://app.apsisspace.com/about'
const TITLE = 'About — Apsis Space'
const DESCRIPTION =
  'Apsis Space is an AI-native, real-time 3D satellite tracker. Here is what it does, how it works, and the data + tech behind it.'

export function About() {
  return (
    <PageShell>
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
      </Helmet>

      <SiteNav maxWidth="max-w-[680px]" />

      <main className="mx-auto max-w-[680px] px-6 py-12 font-sans">
        {/* Hero */}
        <section className="mb-12">
          <p className="text-2xl font-light leading-snug text-white/90">
            Apsis Space is an AI-native, real-time satellite tracker visualizing
            the active space catalog in your browser.
          </p>
        </section>

        {/* What it does */}
        <section className="mb-12 space-y-4 leading-relaxed text-white/70">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-[#00d4ff]">
            What it does
          </h2>
          <p>
            Apsis Space turns complex orbital data into an accessible, interactive
            3D experience. It tracks thousands of active satellites continuously,
            calculating their exact positions, altitudes, and velocities as they
            orbit Earth.
          </p>
          <p>
            Unlike traditional trackers that present you with static maps or
            overwhelming spreadsheets of data, Apsis is designed to be explored.
            You can search for specific payloads, filter by constellation, follow
            satellites in real-time as they cross the globe, and read up on how it
            all works in the{' '}
            <Link href="/learn" className="text-[#00d4ff] hover:underline">
              Learn
            </Link>{' '}
            hub.
          </p>
          <p>
            Built-in AI capabilities let you ask natural-language questions about
            the satellites you are viewing, demystifying the hardware operating
            above our heads. Curious how crowded orbit has become? The{' '}
            <Link href="/stats" className="text-[#00d4ff] hover:underline">
              State of Orbit
            </Link>{' '}
            page breaks down the whole catalog at a glance.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-12 space-y-4 leading-relaxed text-white/70">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-[#00d4ff]">
            How it works
          </h2>
          <p>
            The application relies entirely on client-side propagation to achieve
            smooth 60fps performance. <strong>Two-Line Elements (TLEs)</strong> are
            sourced directly from Celestrak's active catalog.
          </p>
          <p>
            We use the <strong>SGP4 algorithm</strong> to mathematically model satellite orbits
            and predict their positions locally, without continuous server polling.
            This data is then rendered onto a highly performant 3D globe using <strong>CesiumJS</strong>.
          </p>
          <p>
            The intelligence layer is powered by <strong>Claude Haiku</strong> from Anthropic.
            It is provided with precise orbital context about the currently selected
            satellite to deliver relevant, grounded answers to your questions.
          </p>
        </section>

        {/* Data & credits */}
        <section className="mb-12 space-y-4 leading-relaxed text-white/70">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-[#00d4ff]">
            Data &amp; credits
          </h2>
          <p>
            Orbital data comes from{' '}
            <a
              href="https://celestrak.org"
              target="_blank"
              rel="noreferrer"
              className="text-[#00d4ff] hover:underline"
            >
              Celestrak
            </a>
            , maintained by Dr. T.S. Kelso, drawing on the public catalog
            published by the U.S. Space Force. Propagation uses the open-source{' '}
            <code className="text-white/80">satellite.js</code> implementation of
            SGP4/SDP4, and the globe is rendered with the open-source CesiumJS
            engine. Apsis Space is an independent project, not affiliated with NASA,
            ESA, or any satellite operator.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-4 space-y-4 leading-relaxed text-white/70">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-[#00d4ff]">
            Contact
          </h2>
          <p>
            Questions, feedback, or corrections are welcome:
            <br />
            <a
              href="mailto:hello@apsisspace.com"
              className="mt-2 inline-block font-mono text-[#00d4ff] hover:underline"
            >
              hello@apsisspace.com
            </a>
          </p>
        </section>
      </main>

      <SiteFooter maxWidth="max-w-[680px]" />
    </PageShell>
  )
}
