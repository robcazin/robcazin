import type { ReactNode } from "react";

type Beat = { year?: string; body: ReactNode };

const beats: Beat[] = [
  {
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        It started under furniture. My first memory of making sound from a
        machine, I was two, crawling under my mother&apos;s Wurlitzer organ -
        from the floor it was hundreds of levers and sliders going up out of
        sight, and down at my level, the pedals. A console with more controls
        than a child could understand, and a child reaching for them anyway.
        I&apos;ve been reaching for some version of that console ever since.
      </p>
    ),
  },
  {
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        Sound was furniture in that house - the first one my father built. The
        stereo was a credenza you lifted the lid on to lower a record in:
        Bacharach, Herb Alpert, Nat Cole. Off the foyer was a small library I
        loved to haunt before I could read what was in it. My mother&apos;s
        shelf ran to the unseen - the I Ching, Edgar Cayce, astrology. My father, 
        who&apos;d built the very room those books sat in, kept to plots that click shut - 
        le Carré, Fleming, the Tom Clancy novels he&apos;d later press on me. He never 
        protested her side of the shelf. Structure and mystery, holding the same house up. 
        I&apos;d spend the rest of my life drawn to that exact pairing - Escher and Dalí,
        Bach and Debussy, precision and dream in the same frame.
      </p>
    ),
  },
  {
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        Then it organized into a purpose, in a theater. I was a kid when I saw{" "}
        <em>2001: A Space Odyssey</em>, and it went off in me like something
        nuclear - the images and the music together, doing something I
        didn&apos;t have words for. I walked out needing to find that sound. I
        talked my way into the local record store asking for &ldquo;the 2001
        music,&rdquo; and went digging through the cut-outs, the records nobody
        bought. I came out having been sold a David Bowie single - &ldquo;Space
        Oddity,&rdquo; not remotely what I&apos;d asked for, and one of the
        biggest influences of my life. The Strauss I was actually chasing, I
        found later. After that I asked for Bach, Beethoven, and Mozart for
        Christmas, and wore out a blue box set of the Brandenburg Concertos until
        I knew every voice.
      </p>
    ),
  },
  {
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        Three forces, then, all live at once. I drew - people called me an
        amazing kid artist, though I leaned to the dark side of it, enough to
        spook a few of my mom&apos;s friends. I took to machines: a Commodore
        VIC-20, a Commodore 64, later a TRS-80, and BASIC, which I used to draw
        schematics on graph paper for how a studio should be wired together -
        before I had a studio or anything to put in one. And at fifteen I asked
        for a guitar and got an Ovation maple electric which I cherished.
      </p>
    ),
  },
  {
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        My first real studio was two cassette decks and the discovery that you
        could bounce between them. That was the whole rig, and it was enough - a
        Billy Joel cassette on a good deck through good headphones, and the top
        of my head coming off. Here&apos;s the thing I only saw later: from those
        cassette decks on, there was never a time I didn&apos;t have a studio.
        Under a loft bed, in the corner of an apartment, eventually a
        soundproofed floor with an isolation booth and a machine room. The scale
        changed; the need never did. What I was always really building was a
        creativity production system - a room where the making could happen -
        and I&apos;ve been building versions of it for fifty years.
      </p>
    ),
  },
  {
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        The pull between art and music took the shape of schools - Parsons or
        Otis for one, Berklee or Miami for the other, and later - an MIT program I dreamed
        about but couldn&apos;t reach. I started at a community college, where I
        wrote an automata program in BASIC and got marked down for it - not the
        last time an idea would cost me marks. Music won the first round: I went
        to the University of Miami as a guitar principal in the Studio Music and
        Jazz program. When I left, I couldn&apos;t take my records, so I gave
        away every LP I owned - something I&apos;d think about later, in New
        York, carrying what I <em>could</em> carry across the city by hand.
      </p>
    ),
  },
  {
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        After UM, I stayed in Miami for a few years. I ran a Mac at a local AlphaGraphics learning Illustrator 1,
        then Illustrator 88, when Adobe&apos;s world was brand new. That&apos;s
        where I got into PostScript - not just using it but taking it apart,
        learning to drive the code beneath the artwork. It felt small. It turned
        out to be the key to everything that followed.
      </p>
    ),
  },
  {
    year: "1990",
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        In 1990 I came to New York as Director of 3D at Limelite Digital, when
        &ldquo;3D&rdquo; still meant convincing people it could be done at all.
        We won an Emmy there, for CBS Sports&apos; Super Bowl broadcast - and a
        real part of that came down to a program I wrote. Artwork then was
        captured on a vector tablet; I built the converter that turned that
        capture into PostScript, the format I&apos;d been living inside since
        Illustrator. The art came in by hand and went out as code I could drive.
        That was the move I&apos;d repeat for twenty years.
      </p>
    ),
  },
  {
    year: "1992",
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        In 1992 I founded my own shop, So! Animation. The cost of entry tells you
        the era: $40,000 for Softimage, $20,000 for an Iris Indigo, and later 
        $50,000 for an Accom WSD disk recorder. The Accom weighed sixty pounds - 
        and I carried it around the city by hand, fifty thousand dollars and sixty 
        pounds of machine under one arm, crossing town to deliver finished work to
        NBC and the Image Group. I worked with designers I admired, building my own design 
        language in parallel with the pipeline I was inventing to keep up with the work.
      </p>
    ),
  },
  {
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        The first room was a 1,200-square-foot loft at 39 East 20th Street, in
        the Flatiron District - exposed brick and an unreasonable amount of excitement.
        Then a bigger one: a 2,200-square-foot penthouse at 220 East 23rd, tenth
        floor, with an 800-square-foot terrace over lower Manhattan. Decades
        earlier it had been a composer&apos;s home, and it still had the light and
        the acoustics to prove it. I built it out properly - isolation booth,
        machine room - the fullest version yet of that two-cassette-deck idea.
      </p>
    ),
  },
  {
    year: "2008",
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        In 2008 we made theatrical-release commercials for Virgin Media, the
        kind of project you rest up from afterward. When we looked up from the
        rest, something had changed. 2009 was, more or less, the end of the work
        - and the start of nearly a decade of contemplation, and a new
        reintegration with the disciplines of programming, art,
        music, and design.
      </p>
    ),
  },
  {
    body: (
      <>
        <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
          So! was on life support, stationed in a 1,000-square-foot high-rise
          apartment in the heart of Times Square, until we were pulled to West Palm
          Beach to co-produce and build a studio for a children&apos;s educational
          series, and stayed in Florida as my other disciplines — industrial design,
          engineering — bloomed. The kid drawing studio schematics on graph paper
          was still at it, decades on.
        </p>
        <p className="leading-relaxed mt-4" style={{ color: "var(--text-dim)" }}>
          Those Florida years are also when faith found me, and when family became
          the center of gravity under everything else. Neither has much to do with
          the work. Both have everything to do with the life.
        </p>
      </>
    ),
  },
  {
    year: "2020",
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        Then the ground moved again. Covid took the work down to almost nothing, and 
        for a few years I didn&apos;t know if I could earn enough to raise my family — old 
        enough, by then, to wonder if I&apos;d been left behind. For most of my life I&apos;d 
        watched specialists get rich on one slice of the work while range got treated as 
        the lesser thing. But what carried me was exactly that range — the generalist&apos;s reach 
        I&apos;d been building since the cassette decks, every discipline I&apos;d ever picked up, 
        pulled together to adapt. When the ground moved, it was the only thing that held.
      </p>
    ),
  },
  {
    year: "now",
    body: (
      <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
        Looking back, the shape is clearer than it ever felt from inside. Three
        forces - image, sound, machine - lit early and never fully separated.
        The disciplines traded the lead for fifty years; the studio was the
        constant under all of it. Music was never a late arrival. It was the
        first one, and the one I kept coming back to. This site is the current
        studio - the production system, finally built as a place you can walk
        into. The music is where it all converges. The rest of the work stands
        behind it.
      </p>
    ),
  },
];

function yearColor(year: string) {
  return year === "now" ? "var(--accent)" : "var(--text-dim)";
}

function YearMarker({ year }: { year: string }) {
  return (
    <div className="hidden md:flex items-baseline justify-end gap-2">
      <span
        className="font-mono-readout tabular-nums"
        style={{ color: yearColor(year) }}
      >
        {year}
      </span>
      <span
        aria-hidden="true"
        className="w-4 shrink-0"
        style={{
          height: "1px",
          background: "var(--line)",
          marginTop: "0.55em",
        }}
      />
    </div>
  );
}

export default function AboutTimeline() {
  return (
    <section className="px-6 py-12">
      <article className="max-w-5xl mx-auto">
        <div
          className="space-y-10 md:space-y-12 border-l md:border-l-0 pl-5 md:pl-0"
          style={{ borderColor: "var(--line)" }}
        >
          {beats.map((beat, i) => (
            <div
              key={i}
              className="md:grid md:grid-cols-[5rem_1fr] md:gap-x-8"
            >
              {/* Desktop gutter */}
              <div className="hidden md:block">
                {beat.year ? <YearMarker year={beat.year} /> : null}
              </div>

              {/* Mobile year label */}
              {beat.year ? (
                <p
                  className="md:hidden font-mono-readout mb-3 tabular-nums"
                  style={{ color: yearColor(beat.year) }}
                >
                  {beat.year}
                </p>
              ) : null}

              {/* Prose column + ruler */}
              <div
                className="md:border-l md:pl-8 max-w-[60ch]"
                style={{ borderColor: "var(--line)" }}
              >
                {beat.body}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
