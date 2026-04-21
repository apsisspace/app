import { Link } from 'wouter'

export function About() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00d4ff]/30">
      {/* Top Navigation */}
      <nav className="mx-auto flex max-w-[680px] items-center justify-between p-4 font-mono text-[11px] uppercase tracking-widest text-white/50">
        <Link href="/" className="hover:text-[#00d4ff] transition-colors">
          &larr; Back to tracker
        </Link>
      </nav>

      <main className="mx-auto max-w-[680px] px-6 py-12 pb-24 font-sans">
        {/* Header */}
        <header className="mb-12 select-none font-mono">
          <h1 className="text-xl font-semibold tracking-[0.3em] uppercase text-[#00d4ff]/80">
            Apsis<span className="text-[#00d4ff]/40"> · </span>Space
          </h1>
        </header>

        {/* Hero */}
        <section className="mb-12">
          <p className="text-2xl font-light leading-snug text-white/90">
            Apsis Space is an AI-native, real-time satellite tracker visualizing
            the active space catalog in your browser.
          </p>
        </section>

        {/* What it does */}
        <section className="mb-12 space-y-4 text-white/70 leading-relaxed">
          <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest uppercase text-[#00d4ff]">
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
            You can search for specific payloads, filter by orbit type, and follow
            satellites in real-time as they cross the globe.
          </p>
          <p>
            Built-in AI capabilities allow you to ask natural language questions
            about the satellites you are viewing, demystifying the hardware operating
            above our heads.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-12 space-y-4 text-white/70 leading-relaxed">
          <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest uppercase text-[#00d4ff]">
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

        {/* Who built this */}
        <section className="mb-12 space-y-4 text-white/70 leading-relaxed">
          <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest uppercase text-[#00d4ff]">
            Who built this
          </h2>
          <p>
            Apsis Space is built and maintained by [AUTHOR_NAME]. [AUTHOR_BIO]
          </p>
        </section>

        {/* Contact */}
        <section className="mb-24 space-y-4 text-white/70 leading-relaxed">
          <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest uppercase text-[#00d4ff]">
            Contact
          </h2>
          <p>
            For questions, feedback, or support, please reach out via email:
            <br />
            <a
              href="mailto:hello@apsisspace.com"
              className="mt-2 inline-block font-mono text-[#00d4ff] hover:underline"
            >
              hello@apsisspace.com
            </a>
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-8 font-mono text-[10px] uppercase tracking-widest text-white/40 flex justify-between items-center">
          <div>&copy; {new Date().getFullYear()} Apsis Space</div>
          <a
            href="https://apsisspace.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#00d4ff] hover:underline"
          >
            apsisspace.com
          </a>
        </footer>
      </main>
    </div>
  )
}
