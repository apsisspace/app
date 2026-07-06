/**
 * Constellation / mission groups used by the on-globe quick-filters and the
 * "State of Orbit" stats page.
 *
 * We only have the Celestrak catalog *name* to work with (no operator field),
 * so membership is a case-insensitive regex over the satellite name. The
 * matchers are intentionally conservative: it's better to under-match a fuzzy
 * name than to sweep unrelated objects into a constellation. The FilterBar
 * hides any group that matches zero satellites in the live catalog, so a
 * matcher that finds nothing simply disappears rather than showing an empty
 * filter.
 *
 * IMPORTANT: none of these RegExps may carry the `g` flag — `.test()` is
 * stateful with a global regex (it advances lastIndex between calls) and
 * would return alternating results across the catalog loop.
 */

export interface SatGroup {
  /** Stable id used in the UI store + URL-free filter state. */
  id: string
  /** Chip / legend label. */
  label: string
  /** One-line tooltip describing the constellation. */
  hint: string
  /** Name matcher. Applied against the UPPER-CASED satellite name. */
  test: RegExp
}

export const SAT_GROUPS: readonly SatGroup[] = [
  {
    id: 'starlink',
    label: 'Starlink',
    hint: "SpaceX's low-Earth-orbit broadband megaconstellation",
    test: /STARLINK/,
  },
  {
    id: 'oneweb',
    label: 'OneWeb',
    hint: 'OneWeb low-Earth-orbit broadband constellation',
    test: /ONEWEB/,
  },
  {
    id: 'gps',
    label: 'GPS',
    hint: 'US GPS / NAVSTAR navigation constellation (MEO)',
    test: /\bGPS\b|NAVSTAR/,
  },
  {
    id: 'galileo',
    label: 'Galileo',
    hint: 'European Galileo navigation constellation (MEO)',
    test: /GALILEO|GSAT0/,
  },
  {
    id: 'glonass',
    label: 'GLONASS',
    hint: 'Russian GLONASS navigation constellation (MEO)',
    test: /GLONASS/,
  },
  {
    id: 'beidou',
    label: 'BeiDou',
    hint: 'Chinese BeiDou navigation constellation',
    test: /BEIDOU/,
  },
  {
    id: 'iridium',
    label: 'Iridium',
    hint: 'Iridium satellite-phone & data constellation (LEO)',
    test: /IRIDIUM/,
  },
  {
    id: 'weather',
    label: 'Weather',
    hint: 'Weather & environmental-monitoring satellites',
    test: /GOES|METEOSAT|HIMAWARI|NOAA|METEOR-|FENGYUN|ELEKTRO|INSAT|MTG|GOMS|DMSP/,
  },
  {
    id: 'stations',
    label: 'Stations',
    hint: 'Crewed space stations (ISS, Tiangong)',
    test: /ISS \(ZARYA\)|ZARYA|TIANHE|TIANGONG|CSS \(/,
  },
  {
    id: 'science',
    label: 'Science',
    hint: 'Space telescopes & science observatories',
    test: /HUBBLE|HST|CHANDRA|WEBB|JWST|SPITZER|FERMI|SWIFT|\bTESS\b|KEPLER|\bXMM\b|INTEGRAL|NUSTAR|IXPE|EUCLID|GAIA/,
  },
] as const

export function groupById(id: string | null | undefined): SatGroup | null {
  if (!id) return null
  return SAT_GROUPS.find((g) => g.id === id) ?? null
}

/** True if `name` belongs to `group`. Case-insensitive. */
export function matchesGroup(group: SatGroup, name: string): boolean {
  return group.test.test(name.toUpperCase())
}
