/* ------------------------------------------------------------------ *
 *  Skeletal Analysis — Learning Path (Coursera-style course)
 *
 *  A course is an ordered list of MODULES. Each module has STEPS.
 *  A step is either a `lesson` (readable content) or a `quiz` (gate).
 *  Steps unlock in order: you can only open a step once every previous
 *  step is completed. A quiz is only "completed" once it is PASSED,
 *  so quizzes act as checkpoints that gate the rest of the course.
 *
 *  Lesson content is an array of blocks rendered by KgcCourse.jsx:
 *    { type: 'p',       text }
 *    { type: 'list',    items: [] }
 *    { type: 'image',   src, caption }
 *    { type: 'callout', tone: 'tip'|'info'|'warn', title, text }
 *    { type: 'facts',   items: [[label, value], ...] }
 * ------------------------------------------------------------------ */

export const PASS_RATIO = 0.7; // fraction of questions needed to pass a quiz

export const COURSE = {
  title: 'Skeletal Analysis — Learning Path',
  subtitle: 'A guided, self-paced course. Clear each checkpoint quiz to unlock the next module.',
  modules: [
    /* ============================ MODULE 1 ============================ */
    {
      id: 'm1',
      title: 'Foundations',
      subtitle: 'What the system does and what it estimates',
      steps: [
        {
          type: 'lesson',
          id: 'm1l1',
          title: 'Welcome & what you will learn',
          minutes: 3,
          blocks: [
            { type: 'p', text: 'Welcome! This short course trains you to run the Automated Skeletal Analysis System with confidence. You will learn what the system estimates, how to read the key skeletal features, and how to work through a real analysis end to end.' },
            { type: 'p', text: 'The course is split into four modules. Between modules there is a short checkpoint quiz — you must pass it to unlock the next module, exactly like a Coursera course.' },
            { type: 'facts', items: [
              ['Modules', '4'],
              ['Checkpoints', '4 quizzes'],
              ['Est. time', '~25 min'],
            ]},
            { type: 'callout', tone: 'info', title: 'How progress works', text: 'Finish a lesson with “Mark complete”. Pass each checkpoint quiz to move on. Your progress is saved on this device, so you can leave and come back anytime.' },
          ],
        },
        {
          type: 'lesson',
          id: 'm1l2',
          title: 'The biological profile: Sex, Age & Height',
          minutes: 4,
          blocks: [
            { type: 'p', text: 'The system estimates a biological profile from a skeletal specimen — three things:' },
            { type: 'facts', items: [
              ['Sex', 'Male / Female / Indeterminate'],
              ['Age', 'A range in years (e.g. 25–35)'],
              ['Height', 'Estimated stature in cm'],
            ]},
            { type: 'p', text: 'You provide observations and measurements from the bone; the system applies established osteology rules and stature formulae (Bass, 2005) and returns each estimate with a confidence score.' },
            { type: 'p', text: 'Different bones tell you different things. A skull is strong for sex and age; the pelvis is excellent for sex and age; long bones (femur, humerus) are what give you height.' },
            { type: 'callout', tone: 'tip', title: 'Key idea', text: 'Each measurement feeds ONE prediction. Sex-indicators, age-indicators and height-indicators are separate — more usable measurements means higher confidence.' },
          ],
        },
        {
          type: 'quiz',
          id: 'm1q',
          title: 'Checkpoint 1 — Foundations',
          questions: [
            {
              q: 'What does the system estimate as the “biological profile”?',
              options: ['Only the age of the person', 'Sex, age range and height', 'The cause of death', 'The DNA sequence'],
              answer: 1,
              explain: 'The biological profile is sex, age range and height (stature).',
            },
            {
              q: 'Which bone is the primary source for estimating HEIGHT?',
              options: ['The skull', 'A long bone such as the femur', 'A single tooth', 'A rib'],
              answer: 1,
              explain: 'Stature is estimated from long-bone length — the femur gives the most accurate height.',
            },
            {
              q: 'What generally happens to confidence as you enter more usable measurements?',
              options: ['It decreases', 'It stays exactly the same', 'It increases', 'It becomes random'],
              answer: 2,
              explain: 'Confidence scales with the number of usable measurements provided.',
            },
          ],
        },
      ],
    },

    /* ============================ MODULE 2 ============================ */
    {
      id: 'm2',
      title: 'Reading the Skull',
      subtitle: 'Sex and age indicators on the cranium',
      steps: [
        {
          type: 'lesson',
          id: 'm2l1',
          title: 'Sex from the skull',
          minutes: 5,
          blocks: [
            { type: 'p', text: 'Three cranial features are strong sex indicators. In general, male skulls are more robust and female skulls more gracile.' },
            { type: 'image', src: '/kb/brow-ridge.png', caption: 'Brow ridge categories — smooth (female-leaning) to very prominent (male-leaning).' },
            { type: 'list', items: [
              'Brow ridge (supraorbital ridge): smooth/less-developed leans Female; prominent/thick leans Male.',
              'Mastoid process (bump behind the ear): small leans Female; large/robust leans Male.',
              'Jaw shape (mandible): rounded/gracile leans Female; square/robust leans Male.',
            ]},
            { type: 'image', src: '/kb/mastoid-size.png', caption: 'Mastoid process categories — small to robust.' },
            { type: 'callout', tone: 'info', title: 'Why the skull works for sex', text: 'These features are shaped by sex-related differences in robustness and muscle attachment, making them reliable sex indicators.' },
          ],
        },
        {
          type: 'lesson',
          id: 'm2l2',
          title: 'Age from the skull',
          minutes: 4,
          blocks: [
            { type: 'p', text: 'Cranial sutures are the fibrous joints between skull bones. They are open in early life and gradually fuse with age, so their closure stage is a secondary age indicator in adults.' },
            { type: 'image', src: '/kb/cranial-suture.png', caption: 'Cranial suture closure — open (younger) to completely closed (older).' },
            { type: 'facts', items: [
              ['Open', '≈ 18–25'],
              ['Partially open', '≈ 25–35'],
              ['Moderately closed', '≈ 35–45'],
              ['Mostly closed', '≈ 45–55'],
              ['Completely closed', '≈ 55+'],
            ]},
            { type: 'callout', tone: 'warn', title: 'Use with care', text: 'Suture closure varies between individuals — combine it with other age indicators rather than relying on it alone.' },
          ],
        },
        {
          type: 'quiz',
          id: 'm2q',
          title: 'Checkpoint 2 — The Skull',
          questions: [
            {
              q: 'A skull shows a smooth brow ridge and a small mastoid process. This leans toward…',
              options: ['Male', 'Female', 'Cannot say anything about sex', 'Old age'],
              answer: 1,
              explain: 'Smooth brow ridge + small mastoid are gracile, female-leaning features.',
            },
            {
              q: 'Which cranial feature is used to estimate AGE?',
              options: ['Brow ridge', 'Mastoid process', 'Cranial suture closure', 'Jaw robustness'],
              answer: 2,
              explain: 'Suture closure progresses with age; the others are sex indicators.',
            },
            {
              q: 'Completely fused (closed) cranial sutures suggest which age band?',
              options: ['18–25', '25–35', '35–45', '55+'],
              answer: 3,
              explain: 'Completely closed sutures indicate an older adult, roughly 55+.',
            },
          ],
        },
      ],
    },

    /* ============================ MODULE 3 ============================ */
    {
      id: 'm3',
      title: 'The Rest of the Skeleton',
      subtitle: 'Pelvis, lower limb, thorax and teeth',
      steps: [
        {
          type: 'lesson',
          id: 'm3l1',
          title: 'The pelvis',
          minutes: 5,
          blocks: [
            { type: 'p', text: 'The pelvis is one of the most reliable bones for sex and age because of features adapted for childbirth.' },
            { type: 'image', src: '/kb/subpubic-angle.png', caption: 'Subpubic angle — wide (>90°, female-leaning) vs narrow (<90°, male-leaning).' },
            { type: 'list', items: [
              'Subpubic angle: wide (>90°) leans Female; narrow (<90°) leans Male.',
              'Greater sciatic notch: wide leans Female; narrow leans Male.',
              'Pubic symphysis surface: smooth (younger) → granular → eroded (older) — an age indicator.',
            ]},
            { type: 'image', src: '/kb/sciatic-notch.png', caption: 'Greater sciatic notch — wide vs narrow.' },
          ],
        },
        {
          type: 'lesson',
          id: 'm3l2',
          title: 'Lower limb & stature',
          minutes: 4,
          blocks: [
            { type: 'p', text: 'The femur is the longest, strongest bone and makes up ~26–27% of total height — which is why it gives the most accurate stature estimate.' },
            { type: 'image', src: '/kb/lower-limb.png', caption: 'The femur — measured for length (height) and head diameter (sex).' },
            { type: 'facts', items: [
              ['Femur length', '→ Height (Stature = 2.15 × femur[cm] + 72.57)'],
              ['Femur head > 43 mm', '→ leans Male'],
              ['Femur head < 41 mm', '→ leans Female'],
              ['Growth plate fused', '→ 25+ (adult)'],
            ]},
            { type: 'image', src: '/kb/growth-plate.png', caption: 'Growth-plate fusion — unfused (sub-adult) to fused (adult).' },
          ],
        },
        {
          type: 'lesson',
          id: 'm3l3',
          title: 'Thorax & teeth',
          minutes: 4,
          blocks: [
            { type: 'p', text: 'Rib margins and teeth both change predictably with age.' },
            { type: 'image', src: '/kb/rib-shape.png', caption: 'Rib sternal-end shape — smooth (young) to irregular/porous (older).' },
            { type: 'list', items: [
              'Rib shape: smooth edges ≈ 18–30; scalloped ≈ 30–50; irregular/porous ≈ 50+.',
              'Teeth type: deciduous ≈ <6; mixed ≈ 6–12; permanent ≈ 12+.',
              'Dental wear: mild ≈ 20–35; moderate ≈ 35–50; severe ≈ 50+.',
            ]},
            { type: 'image', src: '/kb/dental-wear.png', caption: 'Dental wear — mild, moderate, severe.' },
            { type: 'callout', tone: 'tip', title: 'Teeth are durable', text: 'Teeth resist decay and survive when other remains are fragmented, so dentition is a powerful age indicator — especially for the young.' },
          ],
        },
        {
          type: 'quiz',
          id: 'm3q',
          title: 'Checkpoint 3 — The Skeleton',
          questions: [
            {
              q: 'A wide subpubic angle (>90°) and a wide sciatic notch lean toward…',
              options: ['Male', 'Female', 'Age over 55', 'Height over 180cm'],
              answer: 1,
              explain: 'Both wide features are female-leaning pelvic indicators.',
            },
            {
              q: 'Which measurement is used to estimate HEIGHT?',
              options: ['Femur length', 'Sciatic notch width', 'Dental wear', 'Cranial suture'],
              answer: 0,
              explain: 'Femur length drives the stature (height) formula.',
            },
            {
              q: 'Irregular, porous rib margins suggest which age band?',
              options: ['18–30', '30–50', '50+', 'Under 12'],
              answer: 2,
              explain: 'Irregular/porous rib ends indicate older adults (≈50+).',
            },
            {
              q: 'A specimen with only deciduous (baby) teeth is most likely…',
              options: ['Under 6 years old', '25–35 years old', 'Over 55 years old', '12–20 years old'],
              answer: 0,
              explain: 'Deciduous dentition indicates early childhood (<6).',
            },
          ],
        },
      ],
    },

    /* ============================ MODULE 4 ============================ */
    {
      id: 'm4',
      title: 'Using the System',
      subtitle: 'Run an analysis and read the results',
      steps: [
        {
          type: 'lesson',
          id: 'm4l1',
          title: 'The 3-step workflow',
          minutes: 4,
          blocks: [
            { type: 'p', text: 'Running an analysis is three screens:' },
            { type: 'facts', items: [
              ['Step 1', 'Basic info — case ID (auto), investigator, bone type, location, dates'],
              ['Step 2', 'Measurements — fields change with the bone type you chose'],
              ['Step 3', 'Review & predict — see the profile, then Generate Report'],
            ]},
            { type: 'callout', tone: 'warn', title: 'Most important choice', text: 'The bone type you pick in Step 1 decides which measurements Step 2 asks for. Choose it carefully.' },
          ],
        },
        {
          type: 'lesson',
          id: 'm4l2',
          title: 'Confidence & interpretation',
          minutes: 3,
          blocks: [
            { type: 'p', text: 'Step 3 shows Gender, Age Range, Height and a Confidence score. Read them critically:' },
            { type: 'list', items: [
              '“Indeterminate” or “Unknown” is honest output — the inputs didn’t point clearly. Add more diagnostic measurements.',
              'Height only appears for limb bones (femur/humerus).',
              'Low confidence means too few usable measurements — don’t over-trust it.',
              'These are probabilistic estimates from morphology; corroborate with context where it matters.',
            ]},
            { type: 'callout', tone: 'info', title: 'You’re almost there', text: 'Pass the final checkpoint to complete the course and earn your certificate of completion.' },
          ],
        },
        {
          type: 'quiz',
          id: 'm4q',
          title: 'Final Checkpoint — Certification',
          questions: [
            {
              q: 'Which choice in Step 1 decides the measurement fields shown in Step 2?',
              options: ['The location', 'The bone type', 'The analysis date', 'The investigator name'],
              answer: 1,
              explain: 'Bone type determines the Step 2 measurement form.',
            },
            {
              q: 'The result shows Height as “Unknown”. The most likely reason is…',
              options: ['A software bug', 'You analysed a non-limb bone (e.g. skull/teeth)', 'The person was very tall', 'You must restart the app'],
              answer: 1,
              explain: 'Height is only estimated from limb bones; skull/teeth/thorax do not produce stature.',
            },
            {
              q: 'A low confidence score should be interpreted as…',
              options: ['The result is certainly wrong', 'Too few usable measurements — add more before trusting it', 'The specimen is fake', 'Age is over 55'],
              answer: 1,
              explain: 'Low confidence means insufficient usable input, not a definitive error.',
            },
            {
              q: 'A prominent brow ridge, robust mastoid and narrow sciatic notch together lean toward…',
              options: ['Female', 'Male', 'Child', 'Cannot tell'],
              answer: 1,
              explain: 'All three are robust, male-leaning indicators.',
            },
            {
              q: 'Which statement about these predictions is most correct?',
              options: [
                'They are guaranteed exact facts',
                'They are probabilistic estimates that should be corroborated',
                'They replace expert judgement entirely',
                'They only work on modern skeletons',
              ],
              answer: 1,
              explain: 'The system provides supportive, probabilistic estimates — not certainties.',
            },
          ],
        },
      ],
    },
  ],
};

/** Flatten modules → ordered steps, each tagged with its module for gating/UI. */
export const COURSE_STEPS = COURSE.modules.flatMap((mod) =>
  mod.steps.map((step) => ({ ...step, moduleId: mod.id, moduleTitle: mod.title }))
);
