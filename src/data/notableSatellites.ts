/**
 * Curated list of NORAD catalog IDs used for the /satellites index page
 * and the static sitemap. These seed SEO: every entry becomes a crawlable
 * URL at /satellite/:noradId with its own <title> and description.
 *
 * Curation rules:
 *   - Currently active (a deorbited satellite still has a TLE archive
 *     entry at Celestrak but won't appear in the active catalog we fetch,
 *     so the listing will just show "not in current catalog" at runtime).
 *   - Recognizable by non-experts OR scientifically significant.
 *   - Spread across orbit regimes (LEO crewed, LEO Earth obs, MEO nav,
 *     GEO weather/comms, HEO/L2 science) so the landing page demonstrates
 *     the app's range.
 *   - ~100 entries: enough for sitemap breadth, small enough that the
 *     index page stays scannable at a glance.
 *
 * IDs are sourced from Celestrak and N2YO catalogs as of 2024-2025. A
 * handful may decay between now and the next sitemap regeneration; the
 * route handles "not found" gracefully so there's no hard breakage.
 */

export interface NotableSatelliteSeed {
  noradId: number
  /** Optional display-only hint — the live catalog name is authoritative. */
  displayName?: string
}

export const NOTABLE_SATELLITES: NotableSatelliteSeed[] = [
  // --- Crewed / stations ---
  { noradId: 25544, displayName: 'ISS (ZARYA)' },
  { noradId: 48274, displayName: 'CSS (TIANHE)' },

  // --- Great observatories ---
  { noradId: 20580, displayName: 'Hubble Space Telescope' },
  { noradId: 25867, displayName: 'Chandra X-ray Observatory' },
  { noradId: 50463, displayName: 'James Webb Space Telescope' },

  // --- NASA Earth Observing System & heritage ---
  { noradId: 25994, displayName: 'Terra' },
  { noradId: 27424, displayName: 'Aqua' },
  { noradId: 27607, displayName: 'Aura' },
  { noradId: 37849, displayName: 'Suomi NPP' },
  { noradId: 43013, displayName: 'NOAA-20 (JPSS-1)' },
  { noradId: 54234, displayName: 'NOAA-21 (JPSS-2)' },
  { noradId: 28654, displayName: 'NOAA-18' },
  { noradId: 33591, displayName: 'NOAA-19' },
  { noradId: 40069, displayName: 'METEOR-M 2' },
  { noradId: 43689, displayName: 'Aeolus' },
  { noradId: 40697, displayName: 'Sentinel-2A' },
  { noradId: 42063, displayName: 'Sentinel-2B' },
  { noradId: 39634, displayName: 'Sentinel-1A' },
  { noradId: 41456, displayName: 'Sentinel-3A' },

  // --- Geostationary weather ---
  { noradId: 41866, displayName: 'GOES-16' },
  { noradId: 43226, displayName: 'GOES-17' },
  { noradId: 51850, displayName: 'GOES-18' },
  { noradId: 40732, displayName: 'Meteosat-11' },
  { noradId: 40267, displayName: 'Himawari-8' },
  { noradId: 41836, displayName: 'Himawari-9' },

  // --- GPS (Block IIF / III sample) ---
  { noradId: 39166, displayName: 'GPS IIF-3 (USA-232)' },
  { noradId: 39533, displayName: 'GPS IIF-5 (USA-245)' },
  { noradId: 40294, displayName: 'GPS IIF-9 (USA-258)' },
  { noradId: 40730, displayName: 'GPS IIF-10 (USA-262)' },
  { noradId: 41019, displayName: 'GPS IIF-11 (USA-265)' },
  { noradId: 43873, displayName: 'GPS III-1 (USA-289)' },
  { noradId: 44506, displayName: 'GPS III-2 (USA-293)' },

  // --- Galileo ---
  { noradId: 40128, displayName: 'Galileo-7' },
  { noradId: 40129, displayName: 'Galileo-8' },
  { noradId: 41549, displayName: 'Galileo-13' },
  { noradId: 41550, displayName: 'Galileo-14' },
  { noradId: 41859, displayName: 'Galileo-15' },

  // --- GLONASS ---
  { noradId: 37867, displayName: 'COSMOS 2471 (GLONASS)' },
  { noradId: 39155, displayName: 'COSMOS 2485 (GLONASS)' },
  { noradId: 39620, displayName: 'COSMOS 2491 (GLONASS)' },
  { noradId: 44299, displayName: 'COSMOS 2534 (GLONASS)' },
  { noradId: 52984, displayName: 'COSMOS 2564 (GLONASS)' },

  // --- BeiDou ---
  { noradId: 38250, displayName: 'BEIDOU-2 G5' },
  { noradId: 38775, displayName: 'BEIDOU-2 G6' },
  { noradId: 43246, displayName: 'BEIDOU-3 M7' },
  { noradId: 43622, displayName: 'BEIDOU-3 M13' },
  { noradId: 44709, displayName: 'BEIDOU-3 M21' },

  // --- Starlink sample (spread across shells) ---
  { noradId: 44713, displayName: 'STARLINK-1007' },
  { noradId: 45180, displayName: 'STARLINK-1130' },
  { noradId: 46118, displayName: 'STARLINK-1395' },
  { noradId: 47180, displayName: 'STARLINK-1739' },
  { noradId: 48295, displayName: 'STARLINK-2486' },
  { noradId: 49140, displayName: 'STARLINK-3097' },
  { noradId: 50410, displayName: 'STARLINK-3515' },
  { noradId: 51778, displayName: 'STARLINK-3945' },
  { noradId: 52705, displayName: 'STARLINK-4362' },
  { noradId: 53215, displayName: 'STARLINK-4558' },
  { noradId: 54026, displayName: 'STARLINK-5023' },
  { noradId: 55148, displayName: 'STARLINK-5484' },
  { noradId: 55749, displayName: 'STARLINK-5831' },
  { noradId: 56400, displayName: 'STARLINK-6110' },
  { noradId: 57300, displayName: 'STARLINK-30065' },
  { noradId: 58148, displayName: 'STARLINK-30443' },
  { noradId: 59054, displayName: 'STARLINK-31012' },
  { noradId: 59734, displayName: 'STARLINK-31365' },
  { noradId: 60176, displayName: 'STARLINK-32145' },
  { noradId: 60650, displayName: 'STARLINK-32534' },

  // --- OneWeb sample ---
  { noradId: 44057, displayName: 'ONEWEB-0008' },
  { noradId: 45133, displayName: 'ONEWEB-0045' },
  { noradId: 45898, displayName: 'ONEWEB-0073' },
  { noradId: 47264, displayName: 'ONEWEB-0152' },
  { noradId: 48128, displayName: 'ONEWEB-0264' },
  { noradId: 49019, displayName: 'ONEWEB-0379' },
  { noradId: 50415, displayName: 'ONEWEB-0483' },
  { noradId: 52114, displayName: 'ONEWEB-0575' },
  { noradId: 53334, displayName: 'ONEWEB-0641' },
  { noradId: 54760, displayName: 'ONEWEB-0703' },

  // --- Iridium NEXT sample ---
  { noradId: 41917, displayName: 'IRIDIUM 113' },
  { noradId: 42805, displayName: 'IRIDIUM 133' },
  { noradId: 43249, displayName: 'IRIDIUM 163' },

  // --- O3b (MEO comms) ---
  { noradId: 40349, displayName: 'O3B FM9' },
  { noradId: 41187, displayName: 'O3B FM13' },
  { noradId: 44114, displayName: 'O3B FM17' },

  // --- Intelsat flagships ---
  { noradId: 41747, displayName: 'INTELSAT 33E' },
  { noradId: 43611, displayName: 'INTELSAT 38' },
  { noradId: 43717, displayName: 'INTELSAT 37E' },

  // --- Science / space weather / deep space ---
  { noradId: 26871, displayName: 'Cluster II-FM6 (Salsa)' },
  { noradId: 27386, displayName: 'ENVISAT' },
  { noradId: 33053, displayName: 'Fermi Gamma-ray Space Telescope' },
  { noradId: 36119, displayName: 'SDO (Solar Dynamics Observatory)' },
  { noradId: 28485, displayName: 'Swift' },
  { noradId: 39197, displayName: 'IRIS' },
  { noradId: 28931, displayName: 'CALIPSO' },
  { noradId: 37755, displayName: 'Suzaku successor / Hitomi (ASTRO-H)' },
  { noradId: 42984, displayName: 'ICESat-2' },

  // --- Radio astronomy / Earth science extras ---
  { noradId: 41765, displayName: 'GOES-15 (standby)' },
  { noradId: 39574, displayName: 'GPM Core' },

  // --- CubeSat / education icons ---
  { noradId: 46826, displayName: 'SXM-7' },
  { noradId: 42784, displayName: 'CYGNSS-1' },

  // --- Commercial imaging ---
  { noradId: 40044, displayName: 'WorldView-3' },
  { noradId: 33331, displayName: 'GeoEye-1' },
  { noradId: 43017, displayName: 'SkySat-14' },

  // --- Amateur radio / other notable ---
  { noradId: 25338, displayName: 'NOAA 15' },
  { noradId: 43937, displayName: 'SAUDISAT 1C' },
  { noradId: 43205, displayName: 'LAGEOS-1' },
]
