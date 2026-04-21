---
topic: constellation
name: Satellite Constellation
aliases: [constellation, megaconstellation, satellite constellation]
sources:
  - url: https://www.esa.int/Enabling_Support/Space_Transportation/Types_of_orbits
    title: ESA — Types of Orbits
  - url: https://en.wikipedia.org/wiki/Satellite_constellation
    title: Wikipedia — Satellite constellation
---

A satellite constellation is a coordinated group of satellites working
together as a system, typically spread across multiple orbital planes to
achieve continuous coverage of Earth or a particular region. Unlike a
solitary satellite that only sees each ground point intermittently, a
constellation is designed so that at any moment — from any location it
targets — at least one (often several) satellites are overhead.

Classic examples include the global navigation systems (GPS, Galileo, GLONASS,
BeiDou), each using roughly 24–30 satellites in medium Earth orbit arranged
in multiple planes to guarantee at least four satellites are visible anywhere
on Earth for positioning. The Iridium constellation of 66 LEO satellites
provides global phone coverage by handing off calls between neighbours.

Modern "megaconstellations" — Starlink, OneWeb, Project Kuiper, Guowang —
dramatically scale this idea. Starlink alone fields thousands of LEO
satellites arranged in multiple shells at different altitudes and
inclinations. They deliver low-latency broadband by passing user traffic
between many satellites and ground gateways, often using optical
inter-satellite links.

Designing a constellation involves trade-offs between number of satellites,
altitude, inclination, phasing within and between planes, and tolerance to
failures. Walker-delta patterns are a common analytic framework for
choosing those parameters.
