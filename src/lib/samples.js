/**
 * Sample resumes.
 *
 * These are ours, not inherited: the previous implementation shipped invented
 * work histories at real companies (Anthropic, Stripe, Vercel) under fictional
 * names, which misattributes statements to employers that never made them.
 *
 * Two rules:
 *
 * 1. Historical samples use documented facts only. They are written with a
 *    factual, third-person summary rather than an invented first-person voice,
 *    because these are real and, in two cases, revered people. Nothing here
 *    should be read as a quotation. Several dates are approximate and marked so.
 *
 * 2. Modern samples are fiction: fictional people, fictional employers,
 *    fictional institutions, and example.com contact details. A fabricated
 *    resume attached to a real living person is a defamation-shaped problem, not
 *    a demo, so no real names appear on that side.
 *
 * Length is deliberate, not decorative. Together these six are the fixture set
 * for the auto-fit engine:
 *
 *   minimal  fonts should grow up to the cap        Aisyah
 *   normal   fill the page comfortably              Abdurrahman, Fatima, Salma
 *   dense    a lot of content, still one page        Al-Khwarizmi
 *   long     must clamp and warn, never clip         Rizky
 */

export const SAMPLE_CATEGORIES = [
  { id: 'historical', label: 'Historical' },
  { id: 'modern', label: 'Modern' },
]

export const DEFAULT_SAMPLE_ID = 'al-khwarizmi'

export const SAMPLES = [
  {
    id: 'al-khwarizmi',
    category: 'historical',
    label: 'Al-Khwarizmi',
    length: 'dense',
    markdown: `# Al-Khwarizmi
Mathematician · astronomer · geographer
Baghdad, Abbasid Caliphate · House of Wisdom · c. 780 – c. 850 CE

---

Scholar of the House of Wisdom in Baghdad, and one of the most consequential figures of the Islamic Golden Age. His treatise on algebra gave the discipline both its methods and its name; his work on arithmetic carried the decimal positional system, by way of a 12th-century Latin translation, into medieval Europe. Very little is known about his life, so this is a resume built from the work rather than from biography.

## APPOINTMENTS

### Scholar — House of Wisdom, Baghdad
c. 820 – c. 850
- Appointed to the House of Wisdom under the patronage of the Abbasid caliph al-Ma'mun
- Worked within the translation and research programme that carried Greek, Persian and Indian learning into Arabic
- Produced mathematics, astronomy and geography from the same institution across three decades

## WORKS

### Al-Jabr — "The Compendious Book on Calculation by Completion and Balancing"
compiled between 813 and 833
- The first systematic treatment of algebra as a discipline in its own right
- Introduced the operations of reduction and balancing, which are still how an equation is solved
- Solved quadratic equations by completing the square, with geometric justifications for each case
- The Latin rendering of its title, al-jabr, is the origin of the word algebra

### Arithmetic on the Hindu–Arabic numeral system
- Set out calculation with the decimal positional notation, including zero as a digit
- Translated into Latin in the 12th century, which is how the numeral system reached Europe
- His name, Latinised as Algoritmi, is the root of algorism and of algorithm

### Zij as-Sindhind — astronomical tables
c. 820
- Compiled planetary and eclipse tables for practical astronomy
- Wrote on the astrolabe and the sundial, and on calendrical computation

### Kitab Surat al-Ard — geography
833
- Revised Ptolemy's Geography, with corrected coordinates for cities and regions

## FIELDS

Algebra · arithmetic · astronomy · geography · calendrical computation · trigonometry

## ALSO WORTH NOTING

- Historians of mathematics commonly describe him as the father of algebra
- Few biographical details survive, including his exact birthplace; he is named for Khwarazm, a region south of the Aral Sea`,
  },

  {
    id: 'abdurrahman-bin-auf',
    category: 'historical',
    label: 'Abdurrahman bin Auf',
    length: 'normal',
    markdown: `# Abdurrahman bin Auf
Merchant · Companion of the Prophet ﷺ
Mecca and Medina · c. 581 – 653 CE

---

Merchant of the Banu Zuhrah clan of the Quraysh. He accepted Islam early, migrated twice — first to Abyssinia, then to Medina in 622 — and arrived in Medina with nothing at all. Offered half of his host's wealth and property, he declined it and asked only to be shown where the market was. He rebuilt a fortune through trade, and was as quick to give it away as to earn it. He was among the ten Companions given the glad tidings of Paradise in their lifetime.

## EXPERIENCE

### Merchant — Mecca, before the migration
- Traded as part of the Quraysh merchant class
- Accepted Islam early in the mission, at the invitation of Abu Bakr
- Joined the first migration to Abyssinia, and later the migration to Medina in 622

### Merchant — Medina, after the migration
622 – 653
- Arrived with no capital; the Prophet ﷺ paired him with Sa'd bin Rabi' of the Ansar
- Declined the offer of half of his host's wealth and property, asking only to be shown the market
- Traded in the market of Qaynuqa and became one of the wealthiest of the Companions

## SERVICE

- Took part in Badr, Uhud and the Battle of the Trench
- Funded the Tabuk expedition, equipping a large share of its mounts and provision from his own wealth
- Was among the six Companions appointed to the council that chose the next caliph, and his advocacy settled it on Uthman

## RECOGNITION

- Named one of the ten Companions given the glad tidings of Paradise in their lifetime

## EDUCATION

- Memorised and narrated hadith from the Prophet ﷺ; his narrations are recorded in the collections

## SKILLS

Trade · negotiation · capital and liquidity management · honest dealing · charitable distribution · counsel`,
  },

  {
    id: 'fatima-al-fihri',
    category: 'historical',
    label: 'Fatima al-Fihri',
    length: 'normal',
    markdown: `# Fatima al-Fihri
Founder and endower of al-Qarawiyyin
Fez, Morocco · c. 800 – c. 880 CE

---

Daughter of a wealthy merchant of Kairouan, in present-day Tunisia, whose family settled in Fez in the early ninth century. She inherited a substantial fortune and pledged all of it to building a mosque and a place of learning for her community. That foundation, al-Qarawiyyin, has been teaching without interruption since the ninth century, and is cited by UNESCO and Guinness World Records as the oldest existing, continually operating higher-education institution in the world. Her sister Mariam founded the al-Andalus mosque in Fez the same year.

## EXPERIENCE

### Founder — al-Qarawiyyin, Fez
857 – 859
- Commissioned and endowed the mosque in the Qarawiyyin quarter of Fez out of her own inheritance
- Chose and bought the land, engaged the builders, and supervised the construction herself
- Established the place of learning alongside the mosque, which grew into the university
- Reported to have fasted for the duration of the building works

## IMPACT

- al-Qarawiyyin became a leading centre of the Islamic Golden Age, teaching theology, jurisprudence, mathematics, astronomy and medicine
- Its library holds manuscripts dating back to the foundation of the mosque
- Cited by UNESCO and Guinness World Records as the oldest continually operating degree-granting institution in the world
- Incorporated into Morocco's state university system in 1963, over a thousand years after its foundation

## EDUCATION

- Educated at home in Kairouan and Fez, in a family known for learning as much as for trade

## SKILLS

Patronage of scholarship · endowment and estate management · construction oversight · community organising`,
  },

  {
    id: 'rizky-pratama',
    category: 'modern',
    label: 'Rizky Pratama — Senior Software Engineer',
    length: 'long',
    markdown: `# Rizky Pratama
Senior Software Engineer
Jakarta, Indonesia · rizky.pratama@example.com · example.com/rizky-pratama

---

I build the parts of a product nobody notices until they break: payments, sync, and the pipelines that move money without waking anyone up at night. Eleven years across four teams, most of it spent making systems smaller and faster rather than larger and cleverer.

## EXPERIENCE

### Senior Software Engineer — Nusantara Labs, Jakarta
2021 – Present
- Led the migration of the payments service from a single deployable into three bounded services, cutting p99 latency from 850ms to 140ms
- Designed the idempotency layer that ended double charges; it has held for two years and roughly ninety million payments
- Built the nightly reconciliation pipeline that matches ledger entries against bank settlements and pages a human only on real mismatches
- Mentored five engineers, two of whom moved from junior to mid-level within a year
- Wrote the incident review template now used across the platform group

### Senior Backend Engineer — Bumi Teknologi, Jakarta
2018 – 2021
- Rebuilt the order ingestion path for flash sales, from 400 to 9,000 requests per second on the same hardware
- Introduced structured logging and tracing across fourteen services, taking mean time to identify a fault from hours to under ten minutes
- Cut infrastructure spend by 32% by right-sizing instances and removing two redundant caches
- Ran the on-call rotation for two years and halved out-of-hours pages

### Backend Engineer — Kirana Digital, Bandung
2015 – 2018
- Built the multi-currency settlement engine for the marketplace, including rounding and foreign exchange handling
- Replaced a nightly batch ledger with an event-sourced one, removing a two-hour reconciliation window
- Wrote the integration suite that caught the three regressions which would otherwise have reached production

### Software Engineer — Warung Semesta
2014 – 2015
- Built and shipped the ordering flow used by sixty merchants within the first six months
- Set up the deploy pipeline and staging environment as the second engineer on the team
- Learned to say no to features that would have outrun the team

## EDUCATION

### BSc in Computer Science — Universitas Teknologi Nusantara
2010 – 2014
Thesis on failure recovery in distributed key-value stores

## SKILLS

Go · Java · PostgreSQL · Kafka · Redis · Kubernetes · Terraform · event sourcing · idempotency and reconciliation · observability · teaching through code review`,
  },

  {
    id: 'aisyah-nurhidayah',
    category: 'modern',
    label: 'Aisyah Nurhidayah — New graduate',
    length: 'minimal',
    markdown: `# Aisyah Nurhidayah
Software Engineering Graduate
Bandung, Indonesia · aisyah.nurhidayah@example.com · example.com/aisyah-nurhidayah

---

New graduate in software engineering, looking for a first role on a backend or platform team. Most of what I know came from building things that were too ambitious for one semester and finishing them anyway.

## EXPERIENCE

### Software Engineering Intern — Nusantara Labs
mid 2025
- Added pagination and filtering to an internal reporting endpoint used daily by the support team
- Wrote the tests that caught a date-boundary bug before it shipped

## PROJECTS

### Thesis — queueing simulation for campus lab scheduling
2026
- Modelled waiting times for a shared laboratory and compared two scheduling policies

## EDUCATION

### BSc in Software Engineering — Universitas Teknologi Nusantara
2022 – 2026

## SKILLS

Go · Python · PostgreSQL · Git · writing tests · reading other people's code`,
  },

  {
    id: 'salma-kusuma',
    category: 'modern',
    label: 'Salma Kusuma — Career changer',
    length: 'normal',
    markdown: `# Salma Kusuma
Product Designer (formerly primary school teacher)
Yogyakarta, Indonesia · salma.kusuma@example.com · example.com/salma-kusuma

---

Six years teaching primary school, now designing software. The move is less of a leap than it looks: both jobs are about finding out what someone actually needs, then removing whatever is standing in their way.

## EXPERIENCE

### Product Designer — Kirana Digital, Yogyakarta
2024 – Present
- Owned the redesign of the merchant onboarding flow, taking completion from 54% to 81% across two quarters
- Ran the team's first usability research programme: twenty sessions, and a repository of findings that is still in use
- Built the component library in code alongside an engineer, so the designs survived contact with the real product

### Primary School Teacher — SD Harapan Bumi, Yogyakarta
2018 – 2024
- Taught a class of twenty-eight across the full primary curriculum
- Designed the school's first digital literacy unit, still taught to two year groups
- Ran workshops for colleagues on lesson design; the approach was adopted across the school

## PROJECTS

### Career transition — design programme and portfolio
2023 – 2024
- Completed a six-month part-time product design programme while still teaching full time
- Rebuilt three portfolio case studies around measurable outcomes rather than visuals
- Volunteered with a local literacy non-profit to design their reading progress tracker

## EDUCATION

### BEd in Primary Education — Universitas Pendidikan Nusantara
2014 – 2018

### Product Design Programme — part-time, Yogyakarta
2023 – 2024

## SKILLS

User research · interaction design · Figma · design systems · facilitation · curriculum design · explaining complex things simply`,
  },
]

export function getSample(id) {
  return SAMPLES.find((sample) => sample.id === id) ?? null
}

export function samplesByCategory(category) {
  return SAMPLES.filter((sample) => sample.category === category)
}
