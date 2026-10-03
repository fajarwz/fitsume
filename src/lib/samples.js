/**
 * Sample resumes.
 *
 * These are ours, not inherited: the previous implementation shipped invented
 * work histories at real companies (Anthropic, Stripe, Vercel) under fictional
 * names, which misattributes statements to employers that never made them.
 *
 * Rules:
 *
 * 1. Every sample is a real person, and every fact in one is documented. The text
 *    is written in a factual, third-person voice rather than an invented
 *    first-person one, because these are real people: nothing here should be read
 *    as a quotation or as words they wrote about themselves.
 *
 * 2. `note` and `source` record what the sample is built from, and the gallery
 *    shows both. They live here rather than in the document because the document is
 *    meant to be printed — a disclaimer on the sheet would end up in someone's
 *    exported PDF. A resume is a self-presentation; these are not, so the
 *    provenance belongs beside the description, not inside the page.
 *
 * 3. No invented contact details. The header line carries the lifespan, the place
 *    and the institution instead of an email address or a website: fabricating a way
 *    to contact a real person is a different class of error from fabricating a
 *    bullet point.
 *
 * 4. Sections are the ones a resume uses — EXPERIENCE, EDUCATION, SKILLS, HONOURS —
 *    so the samples demonstrate the shape the tool is for. The parser keys off
 *    `## `, so heading text stays free.
 *
 * Length is deliberate, not decorative. Together these six are the fixture set for
 * the auto-fit engine:
 *
 *   minimal  fonts should grow up to the cap        Zewail
 *   normal   fill the page comfortably              Salam, Abdurrahman, Fatima
 *   dense    a lot of content, still one page       Al-Khwarizmi
 *   long     the fullest one-pager                  Habibie
 *
 * Display order is not declaration order: SAMPLE_ORDER below puts the most ordinary
 * career first. The first card is what a first-time visitor judges the tool by, and a
 * job-by-job professional resume is the shape most people have — not a Nobel
 * laureate's, and not a ninth-century scholar's.
 */

export const SAMPLE_CATEGORIES = [
  { id: 'modern', label: 'Modern' },
  { id: 'historical', label: 'Historical' },
]

/**
 * Seeded resumes carry a stable id derived from the sample's own id.
 *
 * That is what makes "restore" mean restore: it can see which samples are already in
 * the library and add only the ones that were deleted, rather than handing out a second
 * copy of everything. It is also how a row can tell it began life as a sample.
 */
export const SAMPLE_RESUME_PREFIX = 'sample-'

export function sampleResumeId(sample) {
  return `${SAMPLE_RESUME_PREFIX}${sample.id}`
}

export function isSampleResume(resume) {
  return typeof resume?.id === 'string' && resume.id.startsWith(SAMPLE_RESUME_PREFIX)
}

const SAMPLE_LIBRARY = [
  {
    id: 'al-khwarizmi',
    category: 'historical',
    label: 'Al-Khwarizmi, mathematician',
    length: 'dense',
    note: 'Little is recorded of his life, so roles and dates are approximate.',
    source: 'https://en.wikipedia.org/wiki/Al-Khwarizmi',
    markdown: `# Al-Khwarizmi
Mathematician, astronomer and geographer
Baghdad, Abbasid Caliphate · House of Wisdom · c. 780 – c. 850 CE

---

Mathematician and astronomer of the House of Wisdom under the caliph al-Ma'mun. Wrote the first systematic treatment of algebra as a discipline in its own right, and the arithmetic that carried the decimal positional system, by way of a 12th-century Latin translation, into medieval Europe. Commonly described as the father of algebra, and the source of the word algorithm.

## EXPERIENCE

### Scholar — House of Wisdom, Baghdad
c. 820 – c. 850
- Appointed under the patronage of the Abbasid caliph al-Ma'mun
- Worked within the translation and research programme that carried Greek, Persian and Indian learning into Arabic
- Produced mathematics, astronomy and geography from the same institution across three decades

## SELECTED WORKS

### Al-Jabr — "The Compendious Book on Calculation by Completion and Balancing"
compiled between 813 and 833
- The first systematic treatment of algebra as a discipline in its own right
- Introduced the operations of reduction and balancing, which are still how an equation is solved
- Solved quadratic equations by completing the square, with geometric justifications for each case
- The Latin rendering of its title, al-jabr, is the origin of the word algebra

### Arithmetic on the Hindu–Arabic numeral system
- Set out calculation with decimal positional notation, including zero as a digit
- Translated into Latin in the 12th century, which is how the numeral system reached Europe
- His name, Latinised as Algoritmi, is the root of algorism and of algorithm

### Zij as-Sindhind — astronomical tables
c. 820
- Compiled planetary and eclipse tables for practical astronomy
- Wrote on the astrolabe and the sundial, and on calendrical computation

### Kitab Surat al-Ard — geography
833
- Revised Ptolemy's Geography, with corrected coordinates for cities and regions

## EDUCATION

- Educated within the scholarly circles of Baghdad; no record of his teachers survives
- Named for Khwarazm, a region south of the Aral Sea; his exact birthplace is not documented

## SKILLS

Algebra · arithmetic · astronomy · geography · trigonometry · calendrical computation · translation and synthesis across Greek, Persian and Indian sources`,
  },

  {
    id: 'abdurrahman-bin-auf',
    category: 'historical',
    label: 'Abdurrahman bin Auf, merchant',
    length: 'normal',
    note: 'Dates are approximate; the entries follow the historical accounts.',
    source: 'https://en.wikipedia.org/wiki/Abd_al-Rahman_ibn_Awf',
    markdown: `# Abdurrahman bin Auf
Merchant · Companion of the Prophet ﷺ
Mecca and Medina · c. 581 – 653 CE

---

Merchant of the Banu Zuhrah clan of the Quraysh. Accepted Islam early, migrated twice, and arrived in Medina with no capital at all. Declined half of his host's wealth and asked only to be shown the market; rebuilt a fortune through trade, and gave it away as quickly as he earned it.

## EXPERIENCE

### Merchant — Medina
622 – 653
- Arrived with no capital; paired with Sa'd bin Rabi' of the Ansar
- Declined the offer of half of his host's wealth and property, asking only to be shown the market
- Traded in the market of Qaynuqa and became one of the wealthiest of the Companions
- Funded the Tabuk expedition, equipping a large share of its mounts and provision from his own wealth

### Merchant — Mecca
before 622
- Traded as part of the Quraysh merchant class
- Accepted Islam early in the mission, at the invitation of Abu Bakr
- Joined the first migration to Abyssinia, and later the migration to Medina in 622

## SERVICE

- Took part in Badr, Uhud and the Battle of the Trench
- Among the six Companions appointed to the council that chose the next caliph; his advocacy settled it on Uthman

## EDUCATION

- Memorised and narrated hadith from the Prophet ﷺ; his narrations are recorded in the collections

## HONOURS

- Named one of the ten Companions given the glad tidings of Paradise in their lifetime

## SKILLS

Trade · negotiation · capital and liquidity management · honest dealing · charitable distribution · counsel`,
  },

  {
    id: 'fatima-al-fihri',
    category: 'historical',
    label: 'Fatima al-Fihri, founder',
    length: 'normal',
    note: 'Barely documented in her own right; drawn from the history of al-Qarawiyyin.',
    source: 'https://en.wikipedia.org/wiki/Fatima_al-Fihri',
    markdown: `# Fatima al-Fihri
Founder and endower of al-Qarawiyyin
Fez, Morocco · c. 800 – c. 880 CE

---

Daughter of a wealthy merchant of Kairouan, in present-day Tunisia, whose family settled in Fez in the early ninth century. Inherited a substantial fortune and pledged all of it to building a mosque and a place of learning for her community. That foundation has been teaching without interruption since the ninth century.

## EXPERIENCE

### Founder — al-Qarawiyyin, Fez
857 – 859
- Commissioned and endowed the mosque in the Qarawiyyin quarter of Fez out of her own inheritance
- Chose and bought the land, engaged the builders, and supervised the construction herself
- Established the place of learning alongside the mosque, which grew into the university
- Reported to have fasted for the duration of the building works

## PROJECTS

### al-Qarawiyyin — mosque, library and place of learning
- Became a leading centre of the Islamic Golden Age, teaching theology, jurisprudence, mathematics, astronomy and medicine
- Its library holds manuscripts dating back to the foundation of the mosque
- Cited by UNESCO and Guinness World Records as the oldest continually operating degree-granting institution in the world
- Incorporated into Morocco's state university system in 1963, over a thousand years after its foundation

### al-Andalus mosque, Fez
859
- Founded the same year by her sister Mariam, from the same inheritance

## EDUCATION

- Educated at home in Kairouan and Fez, in a family known for learning as much as for trade

## SKILLS

Patronage of scholarship · endowment and estate management · construction oversight · community organising`,
  },

  {
    id: 'bj-habibie',
    category: 'modern',
    label: 'B. J. Habibie, aeronautical engineer and president',
    length: 'long',
    note: 'Roles and dates follow the Britannica record.',
    source: 'https://www.britannica.com/biography/B-J-Habibie',
    markdown: `# B. J. Habibie
Aeronautical engineer and third President of Indonesia
Parepare, South Sulawesi · RWTH Aachen · 1936 – 2019

---

Aeronautical engineer with a decade in aircraft structures in Germany, twenty-two years building Indonesia's aircraft industry, twenty years setting its research and technology policy, and a year as president.

## EXPERIENCE

### President of Indonesia — Jakarta
May 1998 – October 1999
- Lifted restrictions on the press and legalised new political parties
- Held parliamentary elections in 1999, the first free elections in decades

### Minister of State for Research and Technology — Jakarta
1978 – 1998
- Oversaw ten strategic state industries across aerospace, shipbuilding, steel, arms and energy
- Established the Overseas Fellowship, STMDP and STAID scholarship programmes, which sent thousands of Indonesians abroad to study science, engineering and medicine

### President Director — IPTN (Indonesian Aerospace), Bandung
1976 – 1998
- Led the state aircraft manufacturer from its establishment in 1976, building helicopters and small transports under licence, including the CN-235 with CASA of Spain
- Brought the N-250 Gatotkaca to its first flight on 10 August 1995: a 50 to 70 seat regional turboprop with fly-by-wire controls, the first airliner designed in Indonesia

### Structural Engineer — Messerschmitt-Bölkow-Blohm, Hamburg
1965 – 1974
- Structural analysis of lightweight aircraft structures, including development of the Airbus A-300B
- Developed methods for predicting fatigue crack growth under variable operational loads, still known as the Habibie Factor, Theorem and Method
- Rose to senior management in the technology division, an unusual position for a non-German engineer at the time

## EDUCATION

### RWTH Aachen, Germany — Dr.-Ing., aerospace engineering
1965
Dissertation on lightweight construction for supersonic and hypersonic flight, graded "very good"; research assistant to Prof. Hans Ebner at the Institute for Lightweight Construction

### RWTH Aachen, Germany — Diplom-Ingenieur
1960
Awarded cum laude

## HONOURS

- Fellow of the Royal Academy of Engineering, 1990
- Honorary doctorates from Cranfield Institute of Technology, the University of Indonesia, Chungbuk National University and Hankuk University of Foreign Studies

## SKILLS

Structural analysis · lightweight and composite aircraft structures · aerospace programme leadership · research and technology policy · technical education at scale`,
  },

  {
    id: 'abdus-salam',
    category: 'modern',
    label: 'Abdus Salam, theoretical physicist',
    length: 'normal',
    note: 'Roles and dates follow the Nobel Foundation biography.',
    source: 'https://www.nobelprize.org/prizes/physics/1979/salam/biographical/',
    markdown: `# Abdus Salam
Theoretical physicist · Nobel laureate
Jhang, Punjab · Imperial College London · 1926 – 1996

---

Theoretical physicist who helped unify the weak and electromagnetic interactions, and then spent thirty years building the institutions that let physicists from developing countries do research without leaving home.

## EXPERIENCE

### Director — International Centre for Theoretical Physics (ICTP), Trieste
from 1964
- Created the Centre and its Associateships, which brought young physicists from developing countries to Trieste each year and sent them home for the academic year
- Held alongside the professorship at Imperial College

### Professor of Theoretical Physics — Imperial College, London
from 1957
- Professor of theoretical physics for nearly four decades

### Chief Scientific Adviser to the President of Pakistan
1961 – 1974
- Member of the Pakistan Atomic Energy Commission, and of the Scientific Commission of Pakistan

### Lecturer — Cambridge
1954

### Lecturer in Mathematics — Government College, Lahore, and Head of Mathematics, University of the Punjab
1951 – 1954
- Returned to Pakistan intending to found a school of research, and found there was no way to pursue theoretical physics there at the time

## EDUCATION

### St John's College, Cambridge — PhD, theoretical physics
1951
Thesis in quantum electrodynamics; BA with a double First in mathematics and physics, 1949; Smith's Prize, 1950

### Government College, University of the Punjab — MA
1946
Admitted on a scholarship, having recorded the highest marks then seen in the University's matriculation examination

## HONOURS

### Nobel Prize in Physics
1979
Awarded with Sheldon Glashow and Steven Weinberg for contributions to the theory of the unified weak and electromagnetic interaction between elementary particles, including the prediction of the weak neutral current. Nobel lecture: "Gauge Unification of Fundamental Forces"

### Atoms for Peace Medal and Award
Used the prize money to fund visits by young Pakistani physicists to the ICTP

## SKILLS

Quantum field theory · electroweak unification · gauge theory · institution building for science in developing countries · scientific advice to government`,
  },

  {
    id: 'ahmed-zewail',
    category: 'modern',
    label: 'Ahmed Zewail, chemist',
    length: 'minimal',
    note: 'Roles and dates follow the Caltech and Nobel Foundation record.',
    source: 'https://www.caltech.edu/about/news/ahmed-zewail-1946-2016-51594',
    markdown: `# Ahmed Zewail
Chemist · Nobel laureate
Damanhur, Egypt · California Institute of Technology · 1946 – 2016

---

Chemist who founded femtochemistry: using laser flashes a few femtoseconds long to watch chemical reactions as they happen, rather than inferring them afterwards.

## EXPERIENCE

### Linus Pauling Professor of Chemistry — California Institute of Technology
1997 – 2016
- Professor of physics from 1995; Linus Pauling Professor of Chemical Physics, 1990 – 1997; professor from 1982; joined the faculty in 1976
- Director of the Physical Biology Center for Ultrafast Science and Technology

### First chair of the Board of Trustees — Zewail City of Science and Technology, Egypt
from 2011

### Science adviser — United States and United Nations
- Appointed to the President's Council of Advisors on Science and Technology, 2009, and the first U.S. Science Envoy to the Middle East
- United Nations Scientific Advisory Board, 2013

### IBM postdoctoral fellow — University of California, Berkeley
1974 – 1976

## EDUCATION

### University of Pennsylvania — PhD
1974

### Alexandria University — BSc and MSc
1967, 1969

## HONOURS

### Nobel Prize in Chemistry
1999
Sole recipient, for studies of the transition states of chemical reactions using femtosecond spectroscopy

### Further awards
Wolf Prize · King Faisal Prize · Albert Einstein World Award · Benjamin Franklin Medal · Robert A. Welch Award · Priestley Gold Medal · Order of Merit, First Class, Egypt, 1995 · elected to the U.S. National Academy of Sciences

## SKILLS

Femtosecond spectroscopy · ultrafast laser science · reaction dynamics · physical biology · scientific diplomacy`,
  },
]

/**
 * Display order: the most ordinary resume first, then the rest of the modern set, then
 * the historical ones. Declarations stay grouped by category above for readability;
 * this is the one place that decides what a visitor sees in what order.
 */
export const SAMPLE_ORDER = [
  'bj-habibie',
  'abdus-salam',
  'ahmed-zewail',
  'al-khwarizmi',
  'abdurrahman-bin-auf',
  'fatima-al-fihri',
]

export const SAMPLES = SAMPLE_ORDER.map((id) => SAMPLE_LIBRARY.find((sample) => sample.id === id))

/** The one a first-time visitor lands on: an ordinary professional career. */
export const DEFAULT_SAMPLE_ID = SAMPLE_ORDER[0]

/**
 * The samples as library records: a stable id, and the markdown the library derives a
 * name and settings from. Nothing here is a template — these go straight into the
 * library as ordinary resumes.
 */
export function sampleResumes() {
  return SAMPLES.map((sample) => ({ id: sampleResumeId(sample), markdown: sample.markdown }))
}

export function getSample(id) {
  return SAMPLES.find((sample) => sample.id === id) ?? null
}

export function samplesByCategory(category) {
  return SAMPLES.filter((sample) => sample.category === category)
}
