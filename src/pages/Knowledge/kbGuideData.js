/* ------------------------------------------------------------------ *
 *  Bone Feature Guide — content
 *  Text condensed from "MY component guide" (osteology reference).
 *  Images live in /public/kb (served at /kb/<name>.png).
 * ------------------------------------------------------------------ */

export const PREDICT_META = {
  Sex:    { color: '#3B82F6', label: 'Sex' },
  Age:    { color: '#8B5CF6', label: 'Age' },
  Height: { color: '#10B981', label: 'Height' },
};

export const BONES = [
  {
    id: 'skull',
    name: 'Skull',
    tagline: 'Cranium & Mandible',
    image: '/kb/skull-all.png',
    predicts: ['Sex', 'Age'],
    intro:
      'The skull is the bony framework of the head that protects the brain and supports the face. It is composed of 22 bones — 8 cranial and 14 facial — joined by immovable fibrous joints called cranial sutures. Because the skull develops differently between males and females and changes gradually with age, it is one of the most valuable skeletal elements for biological profile estimation.',
    features: [
      {
        key: 'brow-ridge',
        name: 'Brow Ridge (Supraorbital Ridge)',
        image: '/kb/brow-ridge.png',
        predicts: 'Sex',
        summary:
          'The bony prominence immediately above the eye sockets on the frontal bone. Male skulls generally show a thicker, broader, more projecting brow ridge; female skulls tend to be smoother and flatter. It is one of the most reliable morphological indicators for sex estimation.',
        categories: [
          { label: 'Smooth', note: 'No visible bony ridge above the orbit.', lean: 'F' },
          { label: 'Less Developed', note: 'Slight bony prominence with minimal projection.', lean: 'F' },
          { label: 'Moderate', note: 'Moderate ridge with some projection.', lean: '—' },
          { label: 'Prominent', note: 'Clearly defined ridge with strong projection.', lean: 'M' },
          { label: 'Very Prominent', note: 'Very thick, projecting ridge forming a continuous arch.', lean: 'M' },
        ],
        importance:
          'Prominence of the brow ridge is strongly influenced by sex-related differences in cranial robustness — a primary indicator for biological sex.',
      },
      {
        key: 'mastoid',
        name: 'Mastoid Process',
        image: '/kb/mastoid-size.png',
        predicts: 'Sex',
        summary:
          'A cone-shaped projection of the temporal bone located just behind the ear opening. It anchors the sternocleidomastoid and other neck muscles. Males typically have larger, thicker, more projecting mastoid processes; females smaller and more delicate ones.',
        categories: [
          { label: 'Small', note: 'Small and poorly developed process.', lean: 'F' },
          { label: 'Medium', note: 'Moderate size with limited projection.', lean: '—' },
          { label: 'Large', note: 'Large process with clear projection.', lean: 'M' },
          { label: 'Robust', note: 'Very large and robust process.', lean: 'M' },
        ],
        importance:
          'The size and robustness of the mastoid process is a reliable morphological trait contributing to the rule-based sex estimation.',
      },
      {
        key: 'jaw-shape',
        name: 'Jaw Shape (Mandible)',
        image: '/kb/jaw-shape.png',
        predicts: 'Sex',
        summary:
          'The mandible is the largest, strongest bone of the face. Male mandibles are generally broad, angular and square with pronounced muscle attachment; female mandibles are narrower, rounded and more gracile.',
        categories: [
          { label: 'Square', note: 'Broad jaw with square chin and angular shape.', lean: 'M' },
          { label: 'Rounded', note: 'Rounded chin with smooth contours.', lean: 'F' },
          { label: 'U-Shaped', note: 'Jaw forming a U-shaped curvature.', lean: '—' },
          { label: 'V-Shaped', note: 'Narrow jaw forming a V-shaped curvature.', lean: 'F' },
          { label: 'Robust', note: 'Very thick, strong, robust mandible.', lean: 'M' },
          { label: 'Gracile', note: 'Thin, delicate, less robust mandible.', lean: 'F' },
        ],
        importance:
          'Jaw shape reflects muscle attachment, hormonal and genetic differences — highly useful for sex estimation.',
      },
      {
        key: 'cranial-suture',
        name: 'Cranial Sutures',
        image: '/kb/cranial-suture.png',
        predicts: 'Age',
        summary:
          'Fibrous joints connecting the skull bones (coronal, sagittal, lambdoid). They stay open in early life for brain growth and gradually fuse with age, making the degree of closure a secondary age indicator in adults.',
        categories: [
          { label: 'Open', note: 'Sutures clearly visible and widely open.', lean: '18–25' },
          { label: 'Partially Open', note: 'Sutures open but beginning to close.', lean: '25–35' },
          { label: 'Moderately Closed', note: 'Partially closed with reduced visibility.', lean: '35–45' },
          { label: 'Mostly Closed', note: 'Mostly closed; only small portions visible.', lean: '45–55' },
          { label: 'Completely Closed', note: 'Completely fused; no visible suture lines.', lean: '55+' },
        ],
        importance:
          'Suture closure increases with age but shows individual variation, so it is used in combination with other age indicators.',
      },
    ],
  },

  {
    id: 'pelvis',
    name: 'Pelvis',
    tagline: 'Hip Bones & Sacrum',
    image: '/kb/pelvis.png',
    predicts: ['Sex', 'Age'],
    intro:
      'The pelvis connects the vertebral column to the lower limbs and is one of the most reliable bones for estimating sex and age, because it carries several sexually dimorphic features linked to childbirth adaptation. Each hip bone forms from the fusion of the ilium, ischium and pubis.',
    features: [
      {
        key: 'subpubic-angle',
        name: 'Subpubic Angle',
        image: '/kb/subpubic-angle.png',
        predicts: 'Sex',
        summary:
          'Also called the pubic arch angle — the angle formed beneath the pubic symphysis where the left and right inferior pubic rami converge. Its openness differs markedly between typical male and female pelves.',
        categories: [
          { label: 'Wide (> 90°)', note: 'Broad, rounded arch — typical female morphology.', lean: 'F' },
          { label: 'Narrow (< 90°)', note: 'Acute, V-shaped arch — typical male morphology.', lean: 'M' },
        ],
        importance:
          'A wide subpubic angle is a strong female indicator, reflecting adaptation of the female pelvis for childbirth.',
      },
      {
        key: 'sciatic-notch',
        name: 'Greater Sciatic Notch',
        image: '/kb/sciatic-notch.png',
        predicts: 'Sex',
        summary:
          'A curved indentation on the posterior border of the ilium that allows passage of the sciatic nerve. Its width, depth and curvature exhibit clear differences between the sexes.',
        categories: [
          { label: 'Wide', note: 'Broad, shallow notch — typical female morphology.', lean: 'F' },
          { label: 'Narrow', note: 'Deep, narrow notch — typical male morphology.', lean: 'M' },
        ],
        importance:
          'The greater sciatic notch is one of the most dependable pelvic indicators for sex estimation.',
      },
      {
        key: 'pubic-symphysis',
        name: 'Pubic Symphysis',
        image: '/kb/pelvis.png',
        predicts: 'Age',
        summary:
          'The joint surface where the left and right pubic bones meet at the front of the pelvis. Throughout adult life the symphyseal face remodels predictably — from a ridged young surface to a granular, eroded older one — making it one of the most reliable adult age indicators (Suchey–Brooks / Todd).',
        categories: [
          { label: 'Smooth / Flat', note: 'Fine ridges and furrows, well-preserved margins.', lean: '18–25' },
          { label: 'Moderate', note: 'Flattening surface, defined rim, mild porosity.', lean: '25–40' },
          { label: 'Rough / Granular', note: 'Coarse, porous surface with erosion.', lean: '40–55' },
          { label: 'Degenerated / Eroded', note: 'Osteophytes, uneven or broken margins.', lean: '55+' },
        ],
        importance:
          'Unlike features that stay constant after maturity, the symphyseal face keeps remodelling with age, giving a continuous age signal.',
      },
    ],
  },

  {
    id: 'lower-limb',
    name: 'Lower Limb',
    tagline: 'Femur (Thigh Bone)',
    image: '/kb/lower-limb.png',
    predicts: ['Sex', 'Age', 'Height'],
    intro:
      'The femur is the longest, strongest and largest bone in the body, accounting for roughly 26–27% of total height — which makes it the single most reliable bone for stature estimation. Its durability means it is frequently recovered from archaeological and forensic contexts.',
    features: [
      {
        key: 'femur-length',
        name: 'Femur Length',
        image: '/kb/lower-limb.png',
        predicts: 'Height',
        summary:
          'Maximum length of the femur, measured with an osteometric board. Because the femur scales tightly with total height, its length feeds directly into the stature regression formula (Stature = 2.15 × femur[cm] + 72.57).',
        categories: [
          { label: 'Measured in mm', note: 'Entered as a number; converted to cm for the stature formula.', lean: '📏' },
        ],
        importance:
          'Long-bone length is the basis of stature estimation — the femur gives the most accurate height prediction of any bone.',
      },
      {
        key: 'femur-head',
        name: 'Femoral Head Diameter',
        image: '/kb/lower-limb.png',
        predicts: 'Sex',
        summary:
          'The diameter of the spherical femoral head that fits into the hip socket. Larger heads are associated with males, smaller with females (thresholds tuned for South Asian populations).',
        categories: [
          { label: '> 43 mm', note: 'Larger head — leans Male.', lean: 'M' },
          { label: '41 – 43 mm', note: 'Overlap zone — indeterminate.', lean: '—' },
          { label: '< 41 mm', note: 'Smaller head — leans Female.', lean: 'F' },
        ],
        importance:
          'Femoral head diameter is a robust metric sex indicator that survives well even in fragmentary remains.',
      },
      {
        key: 'growth-plate',
        name: 'Growth Plate (Epiphyseal Fusion)',
        image: '/kb/growth-plate.png',
        predicts: 'Age',
        summary:
          'The cartilage plates at the ends of long bones fuse when skeletal growth completes (~25 years). Their fusion state cleanly separates sub-adults from adults.',
        categories: [
          { label: 'Unfused', note: 'Growth still active — sub-adult.', lean: '< 18' },
          { label: 'Partially Fused', note: 'Fusion in progress — young adult.', lean: '18–25' },
          { label: 'Fused', note: 'Fusion complete — adult.', lean: '25+' },
        ],
        importance:
          'Epiphyseal fusion is one of the clearest age markers for distinguishing juveniles, adolescents and adults.',
      },
    ],
  },

  {
    id: 'thorax',
    name: 'Thorax',
    tagline: 'Rib Cage & Sternum',
    image: '/kb/thorax.png',
    predicts: ['Age'],
    intro:
      'The thoracic cage — 12 pairs of ribs, the sternum and 12 thoracic vertebrae — protects the heart and lungs. Rib margin morphology and sternum length change with age and body size, providing supporting evidence for the biological profile.',
    features: [
      {
        key: 'rib-shape',
        name: 'Rib Shape (Sternal End)',
        image: '/kb/rib-shape.png',
        altImage: '/kb/rib-shapes-2.png',
        predicts: 'Age',
        summary:
          'The sternal (front) end of a rib remodels throughout life. A smooth, well-preserved margin indicates a young adult; scalloped edges appear in middle age; irregular, porous margins indicate older adults.',
        categories: [
          { label: 'Smooth Edges', note: 'Regular, well-preserved cortical margin.', lean: '18–30' },
          { label: 'Scalloped Edges', note: 'Small rounded indentations, mild remodelling.', lean: '30–50' },
          { label: 'Irregular / Porous', note: 'Rough, eroded, porous margin.', lean: '50+' },
        ],
        importance:
          'Rib sternal-end morphology tracks age-related bone remodelling and is a useful adult age indicator.',
      },
      {
        key: 'sternum-length',
        name: 'Sternum Length',
        image: '/kb/sternum-length.png',
        predicts: 'Age',
        summary:
          'The breastbone runs from the manubrium to the xiphoid process. Its overall length reflects body size and shows sexual dimorphism — longer sterna occur more often in males — though it is always interpreted alongside other features.',
        categories: [
          { label: 'Short', note: 'Reduced length; more common in smaller-bodied individuals.', lean: 'F' },
          { label: 'Medium', note: 'Average proportions in healthy adults.', lean: '—' },
          { label: 'Long', note: 'Elongated sternal body; more frequent in males.', lean: 'M' },
        ],
        importance:
          'Sternum length contributes to body-size assessment and biological profile reconstruction when combined with other bones.',
      },
    ],
  },

  {
    id: 'teeth',
    name: 'Teeth',
    tagline: 'Dentition',
    image: '/kb/teeth-type.png',
    predicts: ['Age'],
    intro:
      'Teeth are the hardest, most decay-resistant structures in the body, so they survive when other remains are fragmented. Tooth type, wear and eruption follow predictable, genetically-regulated patterns — making dentition one of the most reliable sources for age estimation.',
    features: [
      {
        key: 'teeth-type',
        name: 'Teeth Type (Dentition)',
        image: '/kb/teeth-type.png',
        predicts: 'Age',
        summary:
          'Which set of teeth is present places an individual in a broad age band. Deciduous ("baby") teeth mean early childhood; a mix of baby and permanent teeth means 6–12 years; a full permanent set means 12+.',
        categories: [
          { label: 'Deciduous (Baby)', note: '20 baby teeth — early childhood.', lean: '< 6' },
          { label: 'Mixed', note: 'Both deciduous and permanent teeth present.', lean: '6–12' },
          { label: 'Permanent', note: 'Full permanent dentition established.', lean: '12+' },
        ],
        importance:
          'Dentition type is a fast, reliable first-pass age band, especially powerful for sub-adults.',
      },
      {
        key: 'dental-wear',
        name: 'Dental Wear',
        image: '/kb/dental-wear.png',
        predicts: 'Age',
        summary:
          'As permanent teeth are used, enamel wears and dentin becomes exposed. The degree of occlusal wear refines the adult age estimate — mild in young adults, moderate in middle age, severe in older adults.',
        categories: [
          { label: 'Mild', note: 'Enamel intact, cusps sharp, no dentin exposed.', lean: '20–35' },
          { label: 'Moderate', note: 'Cusps flattened, small dentin patches appear.', lean: '35–50' },
          { label: 'Severe', note: 'Extensive enamel loss, dentin widely exposed.', lean: '50+' },
        ],
        importance:
          'Dental wear refines adult age within permanent dentition and also hints at diet and habitual activity.',
      },
      {
        key: 'tooth-eruption',
        name: 'Tooth Eruption',
        image: '/kb/tooth-eruption.png',
        predicts: 'Age',
        summary:
          'The sequence by which teeth emerge into the mouth is highly regulated and predictable, making eruption stage one of the most accurate chronological-age indicators — especially in infants, children and adolescents.',
        categories: [
          { label: 'Neonatal', note: 'No erupted teeth; germs forming in the jaw.', lean: '0–0.5' },
          { label: 'Primary', note: '20 deciduous teeth erupting.', lean: '0.5–3' },
          { label: 'Mixed', note: 'Baby and permanent teeth together.', lean: '6–12' },
          { label: 'Permanent', note: 'Full permanent set, third molars pending.', lean: '12–17' },
          { label: 'Third Molar', note: 'Wisdom teeth erupting.', lean: '17–25' },
        ],
        importance:
          'Eruption stage follows a predictable timeline, giving highly accurate ages for the young.',
      },
    ],
  },
];

/** Flattened list of every feature (with its parent bone) for the auto-player. */
export const FEATURE_SEQUENCE = BONES.flatMap((bone) =>
  bone.features.map((f) => ({ ...f, boneId: bone.id, boneName: bone.name }))
);
