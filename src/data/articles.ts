/**
 * /learn article content.
 *
 * Long-form, fact-reviewed explainers authored for organic search and reader
 * education. Each entry renders its own meta tags + Article/FAQPage JSON-LD
 * (see ArticleRoute). Sourced from reputable references cited in `sources`.
 *
 * To add an article: append an object below, add its slug to a related list,
 * and it is automatically picked up by the hub, sitemap, and router.
 */

import type { Article } from '../types/article'

export const ARTICLES: Article[] = [
  {
    "slug": "how-to-see-the-iss",
    "title": "How to See the ISS: Spot the Space Station With Your Own Eyes",
    "metaTitle": "How to See the ISS: Spot the Space Station",
    "metaDescription": "Learn how to see the ISS with the naked eye: what the space station looks like, why it shines at dawn and dusk, and tools to predict every ISS sighting.",
    "category": "Observing",
    "excerpt": "The International Space Station is the third-brightest thing in the sky, and you need zero equipment to catch it. Here is how to spot the space station, when to look, and how to predict every pass.",
    "keywords": [
      "how to see the ISS",
      "spot the space station",
      "ISS sighting",
      "ISS pass times",
      "see the space station with naked eye",
      "when is the ISS visible",
      "track the ISS",
      "ISS visible tonight"
    ],
    "heroStat": {
      "value": "~400 km",
      "label": "The ISS's average orbital altitude"
    },
    "sections": [
      {
        "heading": "The good news: you already own all the gear you need",
        "paragraphs": [
          "Here is the happy secret that planetariums love to spring on people: seeing the International Space Station takes no telescope, no binoculars, and no astronomy degree. It is one of the brightest objects in the entire night sky, and your eyes are all the equipment the job requires. If you can find the Moon, you can learn how to see the ISS.",
          "What makes this so satisfying is the sheer scale of what you are looking at. The ISS is about 357 feet across, near enough to the length of an American football field including the end zones, and it is home to a rotating international crew orbiting some 400 kilometers (roughly 250 miles) overhead. When you spot that moving point of light, you are watching a crewed spacecraft the size of a stadium coast silently over your town at around 28,000 kilometers per hour (about 17,500 mph). Not bad for a clear evening in the backyard.",
          "The rest of this guide is about turning a lucky glance into a reliable habit: what the station actually looks like, why it only shows up at certain times, and how to know exactly when it will next cross your sky."
        ]
      },
      {
        "heading": "What the space station looks like from the ground",
        "paragraphs": [
          "Forget any mental image of a spaceship with running lights. To the naked eye, the ISS looks like a single bright, steady star that has decided to go for a walk. It slides smoothly across the sky, usually traveling roughly from west to east, and it does not twinkle, flicker, or blink. That steadiness is the giveaway, and it is the single most useful thing to remember when you are trying to spot the space station.",
          "It also moves noticeably faster than a high-altitude airplane, yet far more gracefully than a shooting star, which is gone in a blink. A typical ISS sighting lasts somewhere between two and six minutes from the moment it clears the horizon to the moment it disappears, so you get a genuinely leisurely look. There is no sound, no contrail, and crucially no flashing red or green lights.",
          "That last point is your built-in aircraft filter. Every plane is legally required to carry blinking anti-collision lights, so anything that pulses or strobes is traffic, not the station. A brilliant, silent, unblinking light gliding steadily overhead in a straight line is almost certainly a satellite, and if it is the brightest thing up there, it is very likely the ISS."
        ]
      },
      {
        "heading": "Why the ISS only appears at dawn and dusk",
        "paragraphs": [
          "The ISS does not produce its own light. Like the Moon, it shines only by reflecting sunlight off its hull and its enormous solar arrays. That single fact explains the entire timing puzzle of when the station is visible. For a sighting to happen, two conditions have to line up at once: your patch of ground has to be dark, but the station, way up at orbital altitude, still has to be bathed in sunlight.",
          "That combination only occurs during a window of roughly one to two hours after sunset or before sunrise. In the middle of the night, the ISS is usually flying through Earth's shadow along with you, so there is no sunlight for it to bounce back and it stays invisible. In broad daylight it is technically overhead, but the sky is far too bright for its reflected glow to compete. Twilight is the sweet spot where the geometry works.",
          "One lovely consequence of this is that passes sometimes end mid-sky rather than at the horizon. If you watch the station suddenly dim and vanish while it is still high overhead, you have just seen it fly into Earth's shadow, its own private sunset happening 400 kilometers up. The crew aboard experiences that transition about 16 times a day, racking up 16 sunrises and 16 sunsets every 24 hours."
        ]
      },
      {
        "heading": "How bright is the ISS, really?",
        "paragraphs": [
          "Bright enough to stop you mid-sentence. On a favorable pass, when it flies high overhead and catches the sunlight at a good angle, the ISS ranks as the third-brightest object in the sky after the Sun and the Moon. It routinely reaches around magnitude -4, and on the very best passes it climbs brighter still, rivaling or even outshining Venus, the brightest planet. (On the astronomer's backwards magnitude scale, more negative means brighter, so -4 handily beats a typical bright star near magnitude +1 or 0.)",
          "Its brightness is not fixed, though. It depends on how high the station climbs above your horizon and on the angle between you, the ISS, and the Sun. A pass that only skims low across the horizon will look modest, while one that sails nearly overhead can be genuinely startling. The station's huge, panel-covered solar arrays act like a slow, drifting mirror, and small changes in that geometry make a real difference to how dazzling it appears.",
          "The practical upshot: even from a light-polluted city, a good ISS pass punches through the glow easily. You do not need to escape to a dark rural site to catch it, which is part of why spotting the space station is such an accessible bit of skywatching."
        ]
      },
      {
        "heading": "How often does the space station pass over you?",
        "paragraphs": [
          "More often than most people expect. Because the ISS orbits at an inclination of about 51.6 degrees, its ground track carries it over more than 90 percent of the inhabited Earth, so nearly everyone gets regular opportunities. NASA describes the cadence of good viewing chances as anywhere from once a month to several times a week, depending on your latitude and how the orbit lines up with your local twilight.",
          "The station itself is genuinely busy up there. Completing one lap of the planet in about 90 minutes, it circles Earth roughly 16 times a day. But do not expect 16 sightings, because most of those orbits either happen in daylight, occur while you are in full darkness, or track over a completely different part of the world. Only the passes that thread the twilight needle over your specific location become visible ISS sightings.",
          "This is exactly why a little prediction goes a long way. Rather than staring up hopefully every dusk, it pays to know which evenings the station will actually perform for you, and from which direction it will rise."
        ]
      },
      {
        "heading": "How to predict passes and never miss a sighting",
        "paragraphs": [
          "Every reliable ISS tracker is built on the same foundation. The U.S. Space Force tracks objects in orbit and publishes their orbits as two-line element sets, or TLEs, compact numerical snapshots of where a satellite is and where it is heading. These are distributed through services like Celestrak and Space-Track, and software feeds them into a propagation model (the venerable SGP4 algorithm) to calculate precisely where the station will be, second by second, for any spot on Earth.",
          "For plain-language alerts, NASA's free Spot the Station service will email or text you before a good pass, and long-running community sites such as Heavens-Above, linked from both NASA and ESA, generate detailed pass charts once you set your location. Each prediction tells you the start time, which direction to face, how high the station will climb, and how long the pass will last, so you can be outside and looking the right way before it appears.",
          "This is also where a live 3D view earns its keep. On Apsis Space you can watch the ISS move along its real orbit in real time, see exactly where it is right now relative to your location, and get an intuitive feel for the geometry behind a pass, why it rises where it does, and when it will slip into Earth's shadow. Pairing a pass prediction with a live look at the orbit turns an abstract time-and-compass-heading into something you can actually picture before you step outside."
        ]
      },
      {
        "heading": "Your first sighting, step by step",
        "paragraphs": [
          "Start by getting a prediction for your exact location, either from Spot the Station, Heavens-Above, or by watching the station's live track on Apsis Space. Note the start time, the direction it will appear from (often the west or northwest), and the maximum height it will reach, quoted in degrees above the horizon, where 90 degrees is straight up and a higher number means a brighter, more dramatic pass.",
          "Get outside a couple of minutes early and let your eyes settle. You want a spot with an open view toward the horizon where the pass begins, and it helps to be away from any glaring nearby lights, though you emphatically do not need true dark skies. At the predicted moment, watch for a bright point of light rising and moving steadily in a straight line. It will not blink. It will not make a sound. It will simply glide across the sky and, a few minutes later, either drop toward the far horizon or fade out as it enters Earth's shadow.",
          "That is the whole trick. Once you have caught the space station once, you will find it oddly addictive, and you will start checking the next pass times the way some people check the weather."
        ]
      },
      {
        "heading": "Catch it while you can",
        "paragraphs": [
          "There is a gentle deadline on all of this. After more than two decades of continuous crewed operation, the ISS is nearing the end of its service life. NASA plans to retire the station around 2030 to 2031, bringing it down in a controlled re-entry over the remote South Pacific near Point Nemo, the so-called spacecraft cemetery, with a dedicated deorbit vehicle being developed by SpaceX.",
          "None of that dims tonight's view, and new stations will eventually take its place in the twilight sky. But it does make every clear evening feel a little more worth using. The next time a pass lines up over your town, step outside, look up, and watch a football-field-sized laboratory full of people slide silently across the dusk. You can follow exactly where it is and where it is headed live on Apsis Space, then walk out the door and see the real thing for yourself."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Can you really see the ISS with the naked eye?",
        "a": "Yes. The International Space Station is one of the brightest objects in the night sky and needs no telescope or binoculars. It looks like a bright, steady star moving smoothly across the sky, easily visible even from cities."
      },
      {
        "q": "What does the ISS look like from the ground?",
        "a": "It appears as a single brilliant point of light gliding steadily across the sky, usually from west to east, over two to six minutes. Unlike an aircraft it never blinks or flashes and makes no sound, which is the easiest way to tell them apart."
      },
      {
        "q": "When is the best time to see the space station?",
        "a": "During twilight, roughly one to two hours after sunset or before sunrise. In that window your sky is dark while the station, high overhead, is still lit by the Sun and can reflect its light back to you."
      },
      {
        "q": "How often does the ISS pass over my location?",
        "a": "Good viewing opportunities range from about once a month to several times a week, depending on your latitude and how the orbit aligns with your local twilight. The station circles Earth about 16 times a day, but only some passes are visible from any given spot."
      },
      {
        "q": "How bright is the ISS compared to the stars and planets?",
        "a": "On a favorable overhead pass it is the third-brightest object in the sky after the Sun and Moon, often reaching about magnitude -4 and sometimes rivaling or outshining Venus. Its brightness depends on how high it climbs and the angle of sunlight on its solar arrays."
      },
      {
        "q": "How can I predict when the ISS will be visible?",
        "a": "Use NASA's free Spot the Station alerts, a pass predictor like Heavens-Above, or watch the station's live orbit in real time on Apsis Space. These tools tell you the start time, direction to face, and how high the pass will climb."
      }
    ],
    "sources": [
      {
        "title": "NASA - International Space Station Reference",
        "url": "https://www.nasa.gov/reference/international-space-station/"
      },
      {
        "title": "NASA - Spot the Station Frequently Asked Questions",
        "url": "https://www.nasa.gov/missions/station/spot-the-station-frequently-asked-questions/"
      },
      {
        "title": "ESA - ISS: International Space Station",
        "url": "https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/International_Space_Station/ISS_International_Space_Station"
      },
      {
        "title": "International Space Station - Wikipedia",
        "url": "https://en.wikipedia.org/wiki/International_Space_Station"
      },
      {
        "title": "CelesTrak - Orbital Data (TLEs)",
        "url": "https://celestrak.org/"
      },
      {
        "title": "The Planetary Society - How NASA plans to deorbit the ISS",
        "url": "https://www.planetary.org/articles/how-nasa-plans-to-deorbit-the-international-space-station"
      }
    ],
    "updated": "2026-07-06",
    "related": [
      "what-is-starlink",
      "satellite-orbit-types-leo-meo-geo"
    ]
  },
  {
    "slug": "what-is-starlink",
    "title": "What Is Starlink? Inside SpaceX's Satellite Megaconstellation",
    "metaTitle": "What Is Starlink? SpaceX's Satellite Megaconstellation",
    "metaDescription": "What is Starlink? How SpaceX's 10,000+ low-Earth-orbit satellites deliver internet, why the Starlink train appears after launch, and how to watch them.",
    "category": "Constellations",
    "excerpt": "Starlink is SpaceX's low-Earth-orbit broadband megaconstellation — 10,000-plus satellites near 550 km. Here's how it works, why it forms a \"train,\" and its impact on the night sky.",
    "keywords": [
      "what is Starlink",
      "Starlink satellites",
      "Starlink train",
      "how Starlink works",
      "SpaceX megaconstellation",
      "low Earth orbit internet",
      "Starlink altitude",
      "Starlink astronomy brightness"
    ],
    "heroStat": {
      "label": "Working Starlink satellites in orbit (mid-2026)",
      "value": "10,000+"
    },
    "sections": [
      {
        "heading": "What Starlink Actually Is",
        "paragraphs": [
          "So, what is Starlink? In one sentence: it is SpaceX's satellite-internet service, delivered by a \"megaconstellation\" of thousands of small spacecraft flying in low Earth orbit (LEO). Rather than routing your connection through a cable in the ground, Starlink beams broadband down from the sky to a pizza-box-sized dish outside your home, boat, or aircraft. The result is genuinely global coverage — including remote, rural, maritime, and disaster-struck places where laying fiber is impractical or impossible.",
          "The clever part is the altitude. Traditional satellite internet uses a handful of large satellites parked in geostationary orbit, about 35,786 km above the equator. At that distance a signal takes so long to make the round trip that the delay is painfully noticeable — often around 600 milliseconds. Starlink satellites fly roughly sixty times closer, near 550 km, which slashes that latency to a typical 20 to 40 milliseconds, comfortable enough for video calls and even gaming. The trade-off is that a low satellite races across the sky in minutes and covers only a small patch of ground, so you need a whole swarm of them to keep at least one overhead at all times.",
          "SpaceX launched its first operational batch of 60 satellites in May 2019 and has been launching more almost every week since. Starlink is now, by a wide margin, the largest satellite constellation ever built — and it accounts for the majority of all active spacecraft orbiting Earth."
        ]
      },
      {
        "heading": "How Many Starlink Satellites Are There?",
        "paragraphs": [
          "The honest answer is: more than there were yesterday. As of mid-2026, upwards of 10,000 Starlink satellites are actively operating, out of more than 12,000 launched since 2019. Roughly 1,600 of those early spacecraft have already re-entered the atmosphere and burned up, either at the end of their working lives or after failing on orbit — a deliberate feature of flying so low, since anything in a 550 km orbit naturally decays within a few years if it stops boosting itself.",
          "The number climbs relentlessly because each Falcon 9 launch carries a fresh stack of about 25 to 29 satellites, and SpaceX often flies several Starlink missions per week. Any \"live count\" you read is therefore a snapshot, not a fixed figure — trackers like Celestrak and Jonathan McDowell's catalog update as new objects are cataloged and old ones decay.",
          "Where does it end? SpaceX holds regulatory approval for on the order of 12,000 satellites and has filed with the ITU for a second-generation \"Gen2\" system that could eventually push the total toward 42,000. Whether the constellation ever reaches that ceiling depends on regulators, economics, and the pace of Starship, SpaceX's larger rocket. Either way, the sky overhead is busier than it has ever been — you can watch the whole swarm circulating in real time on Apsis Space."
        ]
      },
      {
        "heading": "Where Starlink Lives: The Orbital Shells",
        "paragraphs": [
          "Starlink does not fly in a single orbit. The satellites are organized into \"shells\" — groups at slightly different altitudes and tilts that together weave a net around the planet. Most operational Starlink satellites sit in shells near 550 km (roughly 540 to 570 km), and the shells are angled at different inclinations: 53.0 and 53.2 degrees for dense mid-latitude coverage, 70 degrees to reach higher latitudes, and a near-polar 97.6 degrees to cover the far north and south. The largest single shell alone is designed for 1,584 satellites arranged in 72 orbital planes of 22 satellites each.",
          "At this altitude the physics is brisk. A Starlink satellite orbits at about 7.5 kilometers per second — roughly 27,000 km/h — and completes one full lap of Earth in around 95 minutes. That means any given satellite is only above your horizon for a few minutes before the next one in the plane takes over, which is exactly why the constellation needs to be so large.",
          "The proposed Gen2 system spreads across an even wider range of altitudes, with shells filed between roughly 340 and 614 km. Flying lower improves latency and makes debris cleanup faster (a dead satellite re-enters sooner), at the cost of needing still more satellites to blanket the same area. If you want to see how these shells stack and interlace in three dimensions, Apsis Space lets you spin the constellation around and watch the planes cross."
        ]
      },
      {
        "heading": "How Starlink Works: From Dish to Internet",
        "paragraphs": [
          "The magic word is \"phased array.\" Both the user dish and the satellite use flat panels packed with hundreds or thousands of tiny antenna elements. By nudging the timing (the phase) of each element, the panel forms a narrow radio beam and steers it electronically — no motors, no moving parts — fast enough to lock onto a satellite streaking overhead and then hand off to the next one every 15 seconds to a couple of minutes without you noticing a hiccup. User links ride the Ku-band; the higher-capacity connections down to SpaceX's ground stations (called gateways) use the Ka-band.",
          "A basic connection works like a relay: your dish sends a request up to a satellite, the satellite passes it down to a nearby gateway that is wired into the terrestrial internet, and the answer comes back the same way. But there is a catch — over oceans, poles, and remote wilderness there is no gateway in sight. That is where Starlink's laser inter-satellite links come in. Newer satellites carry optical terminals (using infrared lasers around 1550 nm) that shoot data straight to their neighbors at around 100 gigabits per second, letting traffic hop across space from satellite to satellite until it finds a gateway on the far side of the planet.",
          "Those laser links are the difference between a network that only works near populated ground stations and one that can genuinely cover the whole globe, including mid-ocean shipping lanes and polar research stations. They also make the constellation more resilient: if one path is congested or unavailable, traffic can reroute through space."
        ]
      },
      {
        "heading": "The Starlink Train: That String of Lights in the Sky",
        "paragraphs": [
          "If you have ever seen a perfectly straight line of evenly spaced lights gliding silently across the twilight sky, you have witnessed the famous \"Starlink train.\" It is one of the most striking sights in modern skywatching, and it appears in the days right after a launch. When a batch is released, all 25-ish satellites are dropped into nearly the same low orbit at once, so for a while they travel nose-to-tail in a tight, glittering conga line that sweeps across the whole sky in just two to five minutes.",
          "The satellites make no light of their own — what you see is reflected sunlight. That is why a Starlink train is best spotted in the hour or two after sunset or before sunrise, when the spacecraft high above are still bathed in sunlight but the ground beneath you has already fallen into darkness. Over the following days and weeks, each satellite fires its onboard ion thrusters (fueled by argon on the latest generation, krypton on earlier ones) to climb from its low deployment orbit up to its assigned operational shell. As they climb, they drift apart, the tidy line stretches into scattered dots minutes apart, and the \"train\" dissolves into the general constellation.",
          "Because the effect is fleeting, timing is everything — a train is most impressive in the first one to three nights after a fresh launch. Apsis Space is a great way to check whether a train is passing over you and to follow the newest batch as it spreads out and settles into formation."
        ]
      },
      {
        "heading": "Too Bright? Starlink and the Night Sky",
        "paragraphs": [
          "The same sunlit reflectivity that makes the Starlink train fun to watch is a serious headache for astronomers. Bright satellites streak through long-exposure telescope images as glowing trails, contaminating scientific data, and the sheer number of them means observatories now contend with photobombing on a nightly basis. Radio astronomy faces a parallel concern, since the satellites' transmissions can leak into the sensitive frequencies that radio telescopes listen to. The International Astronomical Union has recommended that satellites below 550 km stay fainter than magnitude 7 to protect professional research — a threshold most Starlinks unfortunately still exceed.",
          "To its credit, SpaceX has iterated. An early experiment called DarkSat used a dark coating to cut reflectivity, but painting the spacecraft black caused it to overheat, and the dimming was only modest. The more successful VisorSat design added a deployable sunshade to block sunlight from hitting the brightest surfaces, bringing satellites down to around magnitude 6, close to the IAU target. Later satellites adopted a dielectric mirror film that reflects sunlight away from the ground rather than scattering it toward observers. These measures genuinely help — but as SpaceX has moved to larger, more powerful second-generation satellites, brightness has crept back up, and studies continue to find that many spacecraft breach the recommended limit.",
          "The tension is unlikely to vanish, but there is real dialogue: SpaceX has published brightness-mitigation best practices, and the U.S. National Science Foundation signed a coordination agreement with the company to reduce the impact on ground-based astronomy. It is a live example of a broader question the space age keeps posing — how to share a finite, shared sky."
        ]
      },
      {
        "heading": "Watching Starlink for Yourself",
        "paragraphs": [
          "You do not need a telescope to see Starlink. A single dispersed satellite looks like a faint, steadily moving \"star\" that neither blinks nor changes color, and a fresh train is bright enough to catch with the naked eye from a dark-ish backyard. The trick is timing your look to the twilight window after sunset or before dawn, and knowing where and when to aim your gaze — pass predictions depend on your exact location, because a satellite that soars overhead for you may be below the horizon for someone a few hundred kilometers away.",
          "That is where a live tracker earns its keep. Apsis Space renders the entire Starlink constellation in real time and in 3D, so you can see the shells wrapping the globe, follow the most recent launch as its train spreads out, and pick out individual satellites passing over your own patch of sky. It turns an abstract statistic — ten thousand satellites and counting — into something you can actually watch move.",
          "Starlink is the clearest sign yet that low Earth orbit has become infrastructure, as ordinary and as contested as any highway or seabed cable. Understanding what it is, how it works, and why it lights up the dusk is the first step to appreciating the strange new sky above all of us."
        ]
      }
    ],
    "faqs": [
      {
        "q": "How many Starlink satellites are there?",
        "a": "As of mid-2026, more than 10,000 Starlink satellites are actively operating, out of over 12,000 launched since 2019. The number rises almost weekly, since each launch adds about 25 to 29 satellites. SpaceX has approval for roughly 12,000 and has filed for a system that could eventually reach around 42,000."
      },
      {
        "q": "What is the Starlink train and how long does it last?",
        "a": "The Starlink train is the string of evenly spaced lights seen in the days after a launch, when a fresh batch of satellites travels together in a tight line before dispersing. It is most striking in the first one to three nights, and typically fades within a few weeks as the satellites raise their orbits and spread out."
      },
      {
        "q": "How high do Starlink satellites orbit?",
        "a": "Most operational Starlink satellites fly in shells near 550 km altitude (roughly 540 to 570 km) at inclinations of 53 to 97.6 degrees. At that height they travel about 7.5 km/s and circle Earth roughly every 95 minutes. The planned Gen2 system spans a wider range, from about 340 to 614 km."
      },
      {
        "q": "How does Starlink deliver internet?",
        "a": "Your dish uses an electronically steered phased-array antenna to link to satellites overhead on the Ku-band. Satellites relay traffic to ground gateways on the Ka-band, or hop it between each other using infrared laser inter-satellite links to reach areas with no nearby gateway. The low orbit gives typical latency of just 20 to 40 milliseconds."
      },
      {
        "q": "Why are astronomers concerned about Starlink?",
        "a": "Starlink satellites reflect sunlight and leave bright trails across telescope images, and their transmissions can interfere with radio astronomy. Most exceed the International Astronomical Union's recommended magnitude 7 brightness limit. SpaceX has responded with sunshades (VisorSat) and dielectric mirror coatings, though newer, larger satellites have grown brighter again."
      },
      {
        "q": "Can I see and track Starlink satellites myself?",
        "a": "Yes. Look in the dark hour after sunset or before sunrise for a steadily moving point of light that does not blink. A fresh train is easily naked-eye visible. You can find passes over your location and watch the whole constellation in real-time 3D on Apsis Space."
      }
    ],
    "sources": [
      {
        "title": "Starlink — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Starlink"
      },
      {
        "title": "Starlink Statistics — Jonathan McDowell (planet4589.org)",
        "url": "https://planet4589.org/space/con/star/stats.html"
      },
      {
        "title": "Starlink Satellite Constellation — ESA eoPortal",
        "url": "https://www.eoportal.org/satellite-missions/starlink"
      },
      {
        "title": "Optical-to-NIR magnitudes of the Starlink Darksat satellite — Astronomy & Astrophysics",
        "url": "https://www.aanda.org/articles/aa/full_html/2021/03/aa39364-20/aa39364-20.html"
      },
      {
        "title": "Satellite constellations exceed the IAU brightness limits — MNRAS Letters",
        "url": "https://doi.org/10.1093/mnrasl/slaf094"
      },
      {
        "title": "NSF and SpaceX Sign Agreement to Mitigate Impact on Astronomy — IAU CPS",
        "url": "https://cps.iau.org/news/nsf-and-spacex-sign-agreement-to-mitigate-impact-of-starlink-satellites-on-ground-based-astronomy/"
      }
    ],
    "updated": "2026-07-06",
    "related": [
      "satellite-orbit-types-leo-meo-geo",
      "how-to-see-the-iss"
    ]
  },
  {
    "slug": "satellite-orbit-types-leo-meo-geo",
    "title": "Satellite Orbit Types: LEO, MEO, and GEO Explained",
    "metaTitle": "Satellite Orbit Types: LEO, MEO & GEO Explained",
    "metaDescription": "LEO, MEO and GEO explained: the altitudes, orbital periods and jobs of each satellite orbit, from Starlink and the ISS to GPS and weather satellites.",
    "category": "Orbits",
    "excerpt": "Every satellite lives in an orbit, and the orbit dictates the job. Here's how LEO, MEO, GEO and highly elliptical orbits differ in altitude, speed, coverage and latency.",
    "keywords": [
      "types of satellite orbits",
      "LEO MEO GEO",
      "low earth orbit vs geostationary",
      "geostationary orbit altitude",
      "medium earth orbit GPS",
      "satellite orbit altitudes",
      "highly elliptical orbit",
      "Starlink orbit altitude"
    ],
    "heroStat": {
      "value": "35,786 km",
      "label": "Altitude of geostationary orbit above the equator"
    },
    "sections": [
      {
        "heading": "The three big neighborhoods (and one wild card)",
        "paragraphs": [
          "When people talk about the types of satellite orbits, they are almost always talking about one thing in disguise: altitude. How high a satellite flies is the master variable that quietly decides everything else about it, from how fast it moves to what it can see to how much it cost to get there. Space engineers slice the region around Earth into three named bands. Low Earth Orbit (LEO) runs from roughly 160 kilometres up to about 2,000 kilometres. Medium Earth Orbit (MEO) fills the wide gap from 2,000 kilometres to 35,786 kilometres. And Geostationary Earth Orbit (GEO) sits at that oddly specific 35,786-kilometre line above the equator. Together, LEO, MEO and GEO describe where the overwhelming majority of working spacecraft live.",
          "There is also a fourth character worth knowing: the Highly Elliptical Orbit (HEO), which refuses to pick a single altitude and instead swings between a low perigee and a very high apogee. We will come back to that troublemaker later, because it solves a problem the three neat circular bands cannot.",
          "Why does altitude matter so much? Because of Kepler's third law, which is unromantic but ruthless: the higher you orbit, the slower you go and the longer each lap takes. A satellite skimming LEO whips around the planet in about 90 minutes. A GPS satellite up in MEO takes roughly 12 hours. A satellite in GEO takes almost exactly one full day. That single relationship between height and period cascades into every trade-off that follows: coverage, latency, launch cost, and how many satellites you need to do a job. Understanding low earth orbit vs geostationary orbit really comes down to understanding that one physical fact."
        ]
      },
      {
        "heading": "Low Earth Orbit: fast, close, and gloriously crowded",
        "paragraphs": [
          "LEO is the busy downtown of space. Sitting between about 160 and 2,000 kilometres up, a satellite here is moving at roughly 7.8 kilometres per second and completes an orbit in around 90 minutes. The International Space Station is the most famous resident: it orbits near 400 to 420 kilometres, travels at about 28,000 kilometres per hour, and treats its crew to sixteen sunrises and sunsets every single day. Because LEO is so close to the surface, it is also the cheapest orbit to reach, which is exactly why it has become spectacularly crowded. Something like 90 percent of all active satellites live in LEO, and SpaceX's Starlink constellation alone accounts for more than 10,000 of them.",
          "Proximity is LEO's superpower. Being close means Earth-observation and spy satellites can resolve fine detail, and it means internet constellations can bounce signals up and back with very low latency. Many imaging satellites use a special flavour of LEO called a Sun-synchronous orbit, typically 600 to 800 kilometres high and tilted near 98 degrees, which lets them pass over each location at the same local time every day so the lighting stays consistent for comparing images over months and years.",
          "The catch is that a low satellite sees only a small patch of Earth at any moment and races across the sky in minutes, so covering the whole planet takes a swarm rather than a single spacecraft, hence the enormous Starlink and OneWeb constellations. Being low also means brushing against the tenuous upper atmosphere, so LEO satellites steadily lose altitude to drag and need periodic reboosts, or they eventually re-enter and burn up. In a notable 2026 move, SpaceX even began lowering its main Starlink shell from around 550 kilometres to roughly 480 kilometres to shorten how long dead satellites linger. You can watch this teeming layer in real time on Apsis Space, where Starlink trains and the ISS slide across the globe minute by minute."
        ]
      },
      {
        "heading": "Medium Earth Orbit: home of the navigators",
        "paragraphs": [
          "MEO is the vast middle ground, and it is dominated by one killer application: satellite navigation. The Global Positioning System flies at an altitude of about 20,200 kilometres, where each satellite laps the planet roughly twice a day, an orbit with a period near 12 hours. GPS keeps around 31 operational satellites arranged across six orbital planes, which guarantees that from almost anywhere on Earth you can see at least four of them at once, the minimum needed to pin down your position in three dimensions.",
          "Europe's Galileo system uses the same idea a little higher up, at 23,222 kilometres, where each satellite takes about 14 hours to circle Earth. Galileo's full constellation is 24 satellites plus spares, spread across three planes inclined at 56 degrees to the equator. That altitude was chosen deliberately to avoid gravitational resonances, so the satellites barely need station-keeping nudges over their lifetimes.",
          "Why is MEO the sweet spot for navigation? It is a Goldilocks compromise. High enough that each satellite sees a big slice of the planet, so a couple of dozen spacecraft can blanket the entire globe, but not so high that timing signals become sluggish or the orbits become expensive to maintain. Navigation is fundamentally about precise geometry and precise timing, and medium Earth orbit delivers both without demanding a mega-constellation."
        ]
      },
      {
        "heading": "Geostationary orbit: parked over one spot",
        "paragraphs": [
          "GEO is the magic trick of orbital mechanics. At exactly 35,786 kilometres above the equator, which is about 42,164 kilometres from Earth's centre, a satellite's orbital period matches the planet's rotation, one sidereal day of 23 hours, 56 minutes and 4 seconds. Match Earth's spin precisely and something wonderful happens: from the ground, the satellite appears to hang motionless in the sky. Point a dish at it once and you never have to move the dish again.",
          "A quick but important distinction: a geostationary orbit is a special case of a geosynchronous orbit. Geosynchronous means the period equals one day, but if the orbit is tilted or not perfectly circular, the satellite traces a slow figure-eight in the sky (an analemma) rather than sitting perfectly still. Geostationary means zero inclination over the equator, so it truly parks. Every geostationary orbit is geosynchronous, but not every geosynchronous orbit is geostationary.",
          "This is why GEO owns two industries. Weather satellites like the GOES and Meteosat families stare at a full disk of the planet and can snap a fresh image every few minutes, perfect for watching hurricanes spin up. And television and communications satellites can broadcast to fixed dishes across whole continents, since just three GEO satellites spaced around the equator cover nearly the entire globe. The downsides are the flip side of that altitude: a signal has to travel about 36,000 kilometres each way, so round-trip latency is around a quarter of a second, which is fine for TV but painful for gaming or live conversation. Reaching GEO is also expensive, and retired satellites must be boosted roughly 300 kilometres higher into a graveyard orbit to clear the valuable belt for the next occupant."
        ]
      },
      {
        "heading": "Highly elliptical orbits: the long way around",
        "paragraphs": [
          "The three circular bands share a blind spot: GEO satellites sit over the equator, so from far northern latitudes like Russia, Scandinavia or Alaska they hang uselessly low on the horizon. The classic fix is the Molniya orbit, a highly elliptical path with a period of about 12 hours, an inclination of 63.4 degrees, and an eccentricity so pronounced that its apogee reaches roughly 40,000 kilometres while its perigee stays low.",
          "The trick again comes from Kepler: a satellite races through its low perigee but crawls near its distant apogee. By placing that apogee high over the Northern Hemisphere, a Molniya satellite can loiter in view of high-latitude ground stations for eight hours or more of each orbit. Chain a few of them together and you get continuous coverage of regions that geostationary satellites simply cannot serve well.",
          "The name is a nod to history: the Soviet Union's Molniya (Russian for 'lightning') communications satellites have used this orbit since the mid-1960s. The specific 63.4-degree inclination is not a coincidence either, it is the magic angle at which Earth's equatorial bulge stops dragging the orbit's high point out of position. Highly elliptical orbits still serve communications, early-warning and scientific missions today, and they are oddly satisfying to watch accelerate and coast on a 3D tracker."
        ]
      },
      {
        "heading": "The trade-offs: latency, coverage, and the price of altitude",
        "paragraphs": [
          "Put the orbit types side by side and a clean triangle of trade-offs appears between latency, coverage and cost. LEO wins on latency and launch price: it is close, so signals return in tens of milliseconds and rockets do not have to work as hard to get there. But each satellite covers only a small footprint and moves fast, so global service demands thousands of them, and drag keeps chipping away at their altitude.",
          "GEO is the mirror image. A single satellite blankets roughly a third of the planet and stays fixed for cheap, dish-and-forget ground equipment, but you pay for it in a quarter-second of latency and a costly ride all the way out to 35,786 kilometres. MEO threads the needle: broad coverage from a few dozen satellites, moderate latency, and stable orbits, which is exactly why the navigation systems the whole world depends on chose to live there.",
          "There is no single best orbit, only the best orbit for a given job. Imaging and low-latency internet gravitate to LEO. Global positioning settles into MEO. Weather and broadcast anchor themselves in GEO. And when you need to cover the far north, an eccentric HEO earns its keep. Read the altitude and you can usually guess the mission."
        ]
      },
      {
        "heading": "Watch the orbits come alive",
        "paragraphs": [
          "All of this is far easier to feel than to read. The difference between a Starlink satellite ripping across the sky in minutes, a GPS satellite drifting steadily through MEO, and a weather satellite sitting frozen over the equator becomes obvious the moment you see them moving at their true relative speeds.",
          "On Apsis Space you can watch every one of these regimes live in real-time 3D: track the ISS on its 90-minute loop, follow Starlink trains through LEO, spot the GPS and Galileo constellations spread across medium Earth orbit, and see the geostationary belt hanging motionless above the equator. It is the fastest way to turn LEO, MEO and GEO from abstract numbers into something you can actually watch."
        ]
      }
    ],
    "faqs": [
      {
        "q": "What are the three main types of satellite orbits?",
        "a": "The three primary orbit regimes are Low Earth Orbit (LEO, roughly 160 to 2,000 km), Medium Earth Orbit (MEO, about 2,000 to 35,786 km), and Geostationary Earth Orbit (GEO, at 35,786 km above the equator). A fourth type, the Highly Elliptical Orbit (HEO), swings between a low perigee and a very high apogee."
      },
      {
        "q": "What is the difference between LEO and geostationary orbit?",
        "a": "A LEO satellite orbits just a few hundred kilometres up, circles Earth in about 90 minutes, and moves visibly across the sky, so global coverage needs many satellites. A geostationary satellite sits at 35,786 km and matches Earth's rotation, so it appears fixed over one spot and a single satellite covers about a third of the planet, at the cost of higher latency."
      },
      {
        "q": "How high is geostationary orbit?",
        "a": "Geostationary orbit is 35,786 km above Earth's equator, which is about 42,164 km from the centre of the Earth. At that altitude a satellite's orbital period equals one sidereal day (23 hours, 56 minutes, 4 seconds), so it appears to stay fixed in the sky."
      },
      {
        "q": "Why do GPS satellites use medium Earth orbit?",
        "a": "GPS satellites fly in MEO at about 20,200 km with a 12-hour period because it is a geometric sweet spot. That altitude is high enough for each satellite to see a large portion of Earth, so roughly 24 to 31 satellites can guarantee that at least four are visible from anywhere, which is the minimum needed to fix a position."
      },
      {
        "q": "Why is Starlink in low Earth orbit instead of GEO?",
        "a": "Starlink uses LEO (around 550 km, being lowered toward 480 km) because proximity means low latency, which is essential for responsive internet. The trade-off is that each satellite covers a small area and moves fast, so Starlink needs a constellation of over 10,000 satellites to provide continuous global coverage."
      },
      {
        "q": "Which satellite orbit has the lowest latency?",
        "a": "Low Earth Orbit has the lowest latency because signals only travel a few hundred kilometres each way, giving round trips of tens of milliseconds. Geostationary orbit has the highest latency of the common orbits, around a quarter of a second, because signals must travel roughly 36,000 km in each direction."
      }
    ],
    "sources": [
      {
        "title": "ESA - Types of orbits",
        "url": "https://www.esa.int/Enabling_Support/Space_Transportation/Types_of_orbits"
      },
      {
        "title": "GPS.gov - Space Segment",
        "url": "https://www.gps.gov/systems/gps/space/"
      },
      {
        "title": "ESA - Galileo: a constellation of navigation satellites",
        "url": "https://www.esa.int/Applications/Satellite_navigation/Galileo/Galileo_a_constellation_of_navigation_satellites"
      },
      {
        "title": "NASA - International Space Station",
        "url": "https://www.nasa.gov/reference/international-space-station/"
      },
      {
        "title": "CelesTrak - Satellite Catalog and Orbital Data",
        "url": "https://celestrak.org/"
      },
      {
        "title": "NOAA NESDIS - Geostationary Satellites",
        "url": "https://www.nesdis.noaa.gov/our-satellites/currently-flying/geostationary-satellites"
      }
    ],
    "updated": "2026-07-06",
    "related": [
      "sun-synchronous-orbit",
      "what-is-starlink"
    ]
  },
  {
    "slug": "sun-synchronous-orbit",
    "title": "Sun-Synchronous Orbit (SSO): How Satellites Keep the Sun on a Schedule",
    "metaTitle": "Sun-Synchronous Orbit (SSO): How It Works",
    "metaDescription": "A sun-synchronous orbit (SSO) uses Earth's oblateness to keep a constant local solar time, giving Landsat, Sentinel, and weather satellites steady light.",
    "category": "Orbits",
    "excerpt": "The near-polar orbit that turns Earth's bulge into a clock, keeping the Sun at a constant angle on every pass so imaging satellites see consistent light.",
    "keywords": [
      "sun-synchronous orbit",
      "SSO",
      "polar orbit imaging",
      "J2 nodal precession",
      "Landsat orbit",
      "Sentinel-2 orbit",
      "local solar time",
      "Earth observation satellites"
    ],
    "heroStat": {
      "label": "Typical SSO inclination — just past polar",
      "value": "~98°"
    },
    "sections": [
      {
        "heading": "What a sun-synchronous orbit actually is",
        "paragraphs": [
          "A sun-synchronous orbit (SSO) is a near-polar low Earth orbit arranged so that a satellite flies over any given latitude at the same local solar time on every pass. It is not that the satellite is above the same clock reading everywhere on Earth at once; rather, whenever it crosses, say, 40 degrees north heading south, the Sun is always in roughly the same spot in the sky. Freeze the Sun angle, and you freeze the lighting.",
          "These orbits live in the busy neighborhood of low Earth orbit, typically 600 to 800 km up, with orbital periods in the 96 to 101 minute range. That works out to roughly 14 to 15 laps around the planet every day, with the ground track shifting westward each revolution as Earth rotates underneath. The defining inclination sits near 98 degrees, which is why an SSO ground track looks almost, but not quite, like a straight line from pole to pole.",
          "The payoff is consistency. If you photograph the same forest, glacier, or city every few weeks under the same solar geometry, the shadows fall the same way and the images are genuinely comparable. That is why the sun-synchronous orbit is the default home for Earth-imaging satellites, and why polar orbit imaging is nearly synonymous with SSO."
        ]
      },
      {
        "heading": "The trick: turning Earth's bulge into a clock",
        "paragraphs": [
          "Earth is not a perfect sphere. It bulges at the equator, and that oblateness is captured by a number called J2, with a value of about 1.08263 x 10 to the minus 3. The extra mass around the equator exerts a sideways tug on any tilted orbit, causing the whole orbital plane to slowly rotate, or precess, over time. This is nodal precession, and for most missions it is an annoyance that has to be tracked and corrected. Sun-synchronous orbits do something cleverer: they weaponize it.",
          "Here is the insight. As Earth travels around the Sun, the Sun appears to drift eastward across the background sky by about 0.9856 degrees per day, which is simply 360 degrees divided by the 365.2422-day year. If you can make a satellite's orbital plane rotate eastward at exactly that same rate, the angle between the plane and the Sun never changes. The plane effectively chases the Sun around the calendar and always stays in step.",
          "So orbit designers choose the precise combination of altitude and inclination that makes J2 deliver a nodal precession of +0.9856 degrees per day, no more and no less. The beauty of it is that Earth's own lumpy gravity field does the station-keeping for free. No thrusters, no fuel budget, just geometry and patience doing the work."
        ]
      },
      {
        "heading": "Why the inclination is retrograde, and why 90 degrees will not do",
        "paragraphs": [
          "The direction of nodal precession depends on the orbit's inclination. For a prograde orbit tilted less than 90 degrees, J2 drags the ascending node westward. For a retrograde orbit tilted more than 90 degrees, the node drifts eastward instead. Since a sun-synchronous orbit needs that eastward drift to follow the Sun, its inclination has to nudge just past 90 degrees, which is why SSO inclinations are described as retrograde. At the popular 600 to 800 km altitudes, the required tilt lands right around 98 degrees.",
          "This is also why a true polar orbit, at exactly 90 degrees, cannot be sun-synchronous. A 90-degree orbit sees the equatorial bulge symmetrically and experiences essentially zero nodal precession, so its plane stays fixed relative to the stars while the Sun marches away from it. Sun-synchronous orbits are near-polar, not polar, and that small difference is the whole point.",
          "The required inclination climbs steadily as you go higher, and it cannot climb forever. There is a hard ceiling at roughly 5,975 km altitude, where the geometry demands an inclination of 180 degrees. Above that altitude no sun-synchronous orbit exists at all, which is one reason SSO satellites cluster in the relatively low band where the numbers behave."
        ]
      },
      {
        "heading": "Local solar time: the number that defines an SSO",
        "paragraphs": [
          "Because a sun-synchronous satellite crosses the equator at the same local time on every orbit, missions are labeled by that crossing time, expressed as the Local Time of the Ascending Node (LTAN, the northbound crossing) or the descending node (LTDN, the southbound one). Sentinel-2, for instance, holds a mean local solar time of 10:30 in the morning at its descending node. That single figure tells you when in the day the satellite will always be overhead.",
          "Choosing that time is a real engineering trade. A mid-morning crossing near 10:00 to 10:30 is a favorite for optical imagers because the Sun is high enough for crisp, well-lit scenes with informative shadows, yet early enough to beat the afternoon cumulus clouds that tend to pile up over land as the day heats up. Afternoon crossings, like the 13:30 used by weather satellites, capture the atmosphere closer to peak daytime heating, which is useful for cloud and temperature studies.",
          "The consistency is what makes the data scientifically powerful. When every image of a place is captured under matched illumination, change detection becomes tractable: a new clear-cut, a shrinking reservoir, or a bleaching reef stands out against a stable baseline rather than being lost in the noise of shifting light and shadow."
        ]
      },
      {
        "heading": "The workhorses: Landsat, Sentinel, and the weather fleet",
        "paragraphs": [
          "Landsat, the longest-running Earth-observation program there is, flies in a textbook SSO. Landsat 8 and Landsat 9 both orbit at 705 km with an inclination of 98.2 degrees and a period of about 99 minutes, each completing a full 16-day repeat cycle of the globe. Because the two spacecraft are phased 180 degrees apart in the same plane, they effectively halve that to an 8-day revisit, and both cross the equator around 10 in the morning for that consistent Landsat lighting.",
          "Europe's Copernicus Sentinel-2 satellites sit a little higher, at a mean altitude of 786 km and an inclination of 98.62 degrees, with a period near 100.6 minutes and that 10:30 morning descending-node crossing. Each carries a wide 290 km imaging swath, and operating as a constellation they deliver a revisit of about five days at the equator, feeding a free and open global imagery archive.",
          "The weather side runs higher and later. The Joint Polar Satellite System spacecraft, including Suomi NPP and NOAA-20, orbit at roughly 824 km and 98.7 degrees inclination with a 101-minute period, crossing at a 13:30 local time of ascending node and circling Earth about 14 times a day to stitch together near-complete global coverage twice daily. You can find all of these satellites and watch their tilted, near-polar ground tracks in real time on Apsis Space."
        ]
      },
      {
        "heading": "Dawn-dusk orbits: the SSO that never sleeps",
        "paragraphs": [
          "There is a striking special case of the sun-synchronous orbit where the crossing time is set to around 6 a.m. or 6 p.m. so the satellite rides permanently along Earth's terminator, the moving line between day and night. From this vantage the spacecraft is bathed in near-continuous sunlight and rarely, if ever, slips into Earth's shadow. That is a dawn-dusk orbit, and it solves a very practical problem: constant illumination on the solar panels means a steady power supply and far gentler thermal cycling.",
          "This makes dawn-dusk orbits a natural fit for power-hungry radar missions, which carry their own illumination and do not care about sunlight for imaging. Copernicus Sentinel-1, a C-band synthetic aperture radar constellation, flies a dawn-dusk SSO at 693 km with a 98.18-degree inclination, a 98.6-minute period, and an 18:00 local time of ascending node, holding a tight 12-day repeat cycle that enables the interferometry used to measure ground movement to the centimeter. The same near-perpetual sunlight also suits some solar and space-weather observatories that want an uninterrupted view."
        ]
      },
      {
        "heading": "Watch sun-synchronous satellites live on Apsis Space",
        "paragraphs": [
          "Orbital mechanics clicks into place far faster when you can see it move. On Apsis Space you can pull up Landsat 9, Sentinel-2, or NOAA-20 in real-time 3D and watch the hallmark of a sun-synchronous orbit unfold: a near-polar path tilted just past vertical, its ground track sliding steadily westward as the planet turns beneath it, while the orbital plane quietly holds its angle to the Sun day after day.",
          "Line a few SSO satellites up next to spacecraft in other regimes, like the geostationary belt or the mid-altitude navigation constellations, and the design logic becomes obvious at a glance. The retrograde tilt, the low-and-fast period, and the way the whole plane tracks the Sun are exactly the features that make the sun-synchronous orbit the quiet backbone of how we watch our own planet."
        ]
      }
    ],
    "faqs": [
      {
        "q": "What is a sun-synchronous orbit (SSO)?",
        "a": "It is a near-polar low Earth orbit arranged so a satellite passes over each latitude at the same local solar time on every orbit. That keeps the Sun angle, and therefore the lighting, consistent for Earth imaging."
      },
      {
        "q": "Why is a sun-synchronous orbit inclined about 98 degrees?",
        "a": "The orbital plane needs to precess eastward by about 0.9856 degrees per day to track the Sun. Earth's equatorial bulge (the J2 effect) only produces that eastward drift for retrograde orbits tilted past 90 degrees, which works out to roughly 98 degrees at typical 600 to 800 km altitudes."
      },
      {
        "q": "What altitude are sun-synchronous orbits?",
        "a": "Most sit between about 600 and 800 km, with orbital periods of roughly 96 to 101 minutes. Sun-synchronous orbits are impossible above about 5,975 km, where the required inclination would reach 180 degrees."
      },
      {
        "q": "Does a sun-synchronous satellite always fly in sunlight?",
        "a": "Not usually. Most SSOs pass in and out of Earth's shadow each orbit. The exception is the dawn-dusk variant, with a crossing time near 6 a.m. or 6 p.m., which rides the day-night terminator and stays in near-continuous sunlight."
      },
      {
        "q": "Which satellites use sun-synchronous orbits?",
        "a": "Most Earth-observation missions, including Landsat 8 and 9 (705 km, 98.2 degrees), Copernicus Sentinel-2 (786 km, 98.62 degrees) and the radar Sentinel-1, plus polar weather satellites like Suomi NPP and NOAA-20 (824 km, 98.7 degrees)."
      },
      {
        "q": "Is a sun-synchronous orbit the same as a polar orbit?",
        "a": "Not quite. It is near-polar but deliberately tilted a few degrees past 90 degrees. A true 90-degree polar orbit experiences essentially no nodal precession, so it cannot stay synchronized with the Sun."
      }
    ],
    "sources": [
      {
        "title": "Sun-synchronous orbit — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Sun-synchronous_orbit"
      },
      {
        "title": "Landsat Spacecraft Orbit — NASA Landsat Science",
        "url": "https://landsat.gsfc.nasa.gov/about/landsat-spacecraft-orbit/"
      },
      {
        "title": "Copernicus Sentinel-2 — eoPortal",
        "url": "https://www.eoportal.org/satellite-missions/copernicus-sentinel-2"
      },
      {
        "title": "How Suomi NPP Satellite Orbits Earth — NASA",
        "url": "https://www.nasa.gov/centers-and-facilities/goddard/how-suomi-npp-satellite-orbits-earth-and-captures-and-transmits-information-home/"
      },
      {
        "title": "Copernicus Sentinel-1 — eoPortal",
        "url": "https://www.eoportal.org/satellite-missions/copernicus-sentinel-1"
      },
      {
        "title": "Landsat 9 — U.S. Geological Survey",
        "url": "https://www.usgs.gov/landsat-missions/landsat-9"
      }
    ],
    "updated": "2026-07-06",
    "related": [
      "satellite-orbit-types-leo-meo-geo",
      "what-is-starlink"
    ]
  }
]
