---
topic: sun-synchronous-orbit
name: Sun-Synchronous Orbit
aliases: [SSO, sun-synchronous, helio-synchronous]
sources:
  - url: https://www.esa.int/Enabling_Support/Space_Transportation/Types_of_orbits
    title: ESA — Types of Orbits
  - url: https://en.wikipedia.org/wiki/Sun-synchronous_orbit
    title: Wikipedia — Sun-synchronous orbit
---

A sun-synchronous orbit (SSO) is a near-polar low Earth orbit tuned so that
the satellite passes over any given point on Earth at roughly the same local
solar time every day. It achieves this by exploiting the J2 oblateness of
Earth: a carefully chosen inclination (typically around 97–99°) causes the
orbit's ascending node to precess eastward at exactly the rate the Sun
appears to drift across the sky — about 0.9856° per day.

The primary benefit is consistent lighting conditions. For Earth-observing
missions — weather satellites (Terra, Aqua, Suomi NPP, JPSS), imaging
reconnaissance, land-use monitoring — this means every image of the same
location is acquired under the same sun angle, making change detection and
quantitative comparisons much easier.

SSOs are typically at altitudes of 600–900 km with inclinations slightly
greater than 90°. The "mean local time at the ascending node" (MLTAN) is a
defining parameter; common choices are ~10:30 AM (morning orbit) or
~1:30 PM (afternoon orbit) to maximise solar illumination without harsh
shadows.

Because the precession depends on specific altitude–inclination pairings,
SSO injections require more precision than ordinary orbits. Small drifts
accumulate over time and require propulsive corrections, or the satellite's
local time slowly wanders.
