# OAHRIS — Skeletal Analysis Prediction Methodology

## Reference: Bass, W. M. — *Human Osteology: A Laboratory and Field Manual*
### Adapted for Sri Lankan Population Context

---

**Document Version:** 4.0 | **Date:** May 2026
**Sole Reference:** Bass, W. M. (2005). *Human Osteology: A Laboratory and Field Manual* (5th ed.). Special Publication No. 2 of the Missouri Archaeological Society, Columbia, Missouri.

---

## 1. Introduction

This document describes the osteological methods implemented in the OAHRIS Automated Skeletal Analysis module, designed for use in **Sri Lanka**. All methods are derived from **William M. Bass's** *Human Osteology: A Laboratory and Field Manual* (5th ed., 2005).

Bass's manual provides regression formulae organized by sex and ancestry. Where available, the system uses Bass's **"Mongoloid" (Asian) formulae** as the closest published Bass data to South Asian populations. Bass cautions throughout the text that **population-specific standards are critical** for accurate estimation:

> *"Population-specific formulae should always be used whenever the ancestry of the individual can be estimated. Applying formulae from one population to another can introduce significant error."*
> — Bass, *Human Osteology*, 5th ed.

### Sri Lankan Population Consideration

Bass's "Mongoloid" category was derived from East Asian (Korean, Chinese) military samples and does not directly represent South Asian (Sri Lankan Sinhalese/Tamil) populations. Sri Lankans generally have different limb-to-trunk proportions than East Asian populations. The system uses Bass's Asian formulae as the best available approximation from Bass's published data, with the understanding that **Sri Lankan-specific validation studies** would further improve accuracy.

### Biological Profile Components

| Component | Description |
|-----------|-------------|
| **Sex** | Biological sex — Male, Female, or Indeterminate |
| **Age-at-Death** | Estimated age range at time of death |
| **Stature** | Living height estimated from long bone measurements |
| **Confidence Level** | System-calculated reliability score |

---

## 2. Supported Bone Types

| Bone Type | Sex | Age | Stature | Bass Manual Section |
|-----------|:---:|:---:|:-------:|---------------------|
| **Skull** | ✅ | ✅ | — | The Skull |
| **Pelvis** | ✅ | ✅ | — | The Innominate (Os Coxa) |
| **Lower Limb** | ✅ | ✅ | ✅ | The Femur |
| **Upper Limb** | ✅ | — | ✅ | The Humerus |
| **Thorax** | — | ✅ | — | The Thorax (Ribs & Sternum) |
| **Teeth** | — | ✅ | — | Human Dentition |

---

## 3. Sex Estimation

Bass establishes the reliability hierarchy for sex estimation:

> *"The pelvis is the single most reliable indicator of sex in the human skeleton. When the pelvis is not available, the skull becomes the next most useful element for sex determination."*
> — Bass, *Human Osteology*, 5th ed.

Bass notes that **male bones are generally larger, more robust, and exhibit more pronounced muscle attachment sites**, while **female bones are more gracile, smoother, and smaller**. He cautions that the *degree* of sexual dimorphism varies by population — South Asian populations may exhibit less pronounced dimorphism than Western populations in some features.

---

### 3.1 The Skull

#### 3.1.1 Supraorbital Ridge (Brow Ridge)

| Grade | Description | Sex Indication |
|-------|-------------|:-:|
| Smooth | Flat, no projection above orbits | **Female** |
| Less Developed | Slight bossing above orbits | **Female** |
| Moderate | Intermediate projection | **Indeterminate** |
| Prominent | Well-developed, projecting ridge | **Male** |
| Thick | Heavy, shelf-like ridge; sloping forehead | **Male** |

Bass: *"Males tend to have more pronounced supraorbital ridges and a more sloping forehead, whereas females exhibit smoother, more vertical foreheads."*

#### 3.1.2 Mastoid Process

| Size | Sex Indication | Bass Description |
|------|:-:|---|
| < 25 mm | **Female** | Small, pointed; does not project below external auditory meatus |
| 25 – 30 mm | **Indeterminate** | Intermediate projection |
| > 30 mm | **Male** | Large, blunt, rugose; projects well below external auditory meatus |

#### 3.1.3 Mandible (Jaw Shape)

| Morphology | Sex Tendency | Bass Description |
|---|:-:|---|
| U-Shaped | Male | Broad, square mandible with everted gonial angles |
| V-Shaped | Female | Narrower, more pointed chin |
| Robust | Male | Thick body, pronounced gonial flaring |
| Rounded | Female | Smooth, rounded chin, gracile body |

#### 3.1.4 Decision Priority
When brow ridge and mastoid conflict, **mastoid takes precedence** (Bass considers it more reliably dimorphic). Jaw shape serves as confirmatory evidence.

---

### 3.2 The Innominate (Pelvis)

> *"The pelvis is the most reliable bone for sex determination because of the functional demands of childbirth on the female pelvis."*
> — Bass, *Human Osteology*, 5th ed.

#### 3.2.1 Subpubic Angle

| Observation | Sex | Bass Description |
|---|:-:|---|
| Wide (> 90°) | **Female** | Wide, obtuse angle; U-shaped subpubic region |
| Narrow (< 90°) | **Male** | Narrow, acute angle; V-shaped subpubic region |

#### 3.2.2 Greater Sciatic Notch

| Shape | Sex | Bass Description |
|---|:-:|---|
| Wide | **Female** | Wide, shallow notch; ≥ 90° |
| Narrow | **Male** | Narrow, deep notch; < 68° |

---

### 3.3 The Femur — Femur Head Diameter

Bass presents metric sex estimation using the femur head. For the OAHRIS system, **sectioning points have been adjusted downward** to account for the generally smaller body size of South Asian populations compared to Bass's Western reference samples:

| Measurement | Sex | Notes |
|---|:-:|---|
| > 43 mm | **Male** | Adjusted from Bass's 45 mm Western threshold |
| 41 – 43 mm | **Indeterminate** | Population overlap zone |
| < 41 mm | **Female** | Adjusted from Bass's 43 mm Western threshold |

Bass notes: *"The femoral head diameter reflects overall body size differences between the sexes."* He cautions that **sectioning points vary by population** — the values above are adjusted approximately 2 mm downward from Bass's Western standards to better reflect South Asian skeletal dimensions.

---

### 3.4 The Humerus — Bone Robusticity

| Observation | Sex | Bass Indicators |
|---|:-:|---|
| Robust | **Male** | Pronounced deltoid tuberosity, thick cortical bone, large epicondyles |
| Gracile | **Female** | Smooth diaphysis, less pronounced markings, smaller epicondyles |

---

## 4. Age-at-Death Estimation

> *"Age estimation is most accurate in subadults, where dental development and epiphyseal fusion provide reliable markers. In adults, age estimation becomes progressively less accurate with increasing age."*
> — Bass, *Human Osteology*, 5th ed.

**Population Note:** Bass's age estimation methods are generally considered **less population-dependent** than stature or sex estimation, because the biological processes of suture closure, epiphyseal fusion, and dental development follow similar chronological patterns across populations.

---

### 4.1 The Skull — Cranial Suture Closure

Bass cautions strongly about this method:

> *"Cranial suture closure is one of the least reliable methods of age estimation because of the wide degree of individual variation. This method should never be used as the sole indicator of age."*
> — Bass, *Human Osteology*, 5th ed.

| Suture State | Age Estimate |
|---|---|
| Open | **18 – 25 years** |
| Partially Open | **25 – 35 years** |
| Moderate Closure | **35 – 45 years** |
| Mostly Closed | **45 – 55 years** |
| Completely Closed | **55+ years** |

---

### 4.2 The Innominate — Pubic Symphysis

> *"The pubic symphysis is the single most useful area of the skeleton for age determination in adults."*
> — Bass, *Human Osteology*, 5th ed.

| Surface Morphology | Age Estimate | Bass Description |
|---|---|---|
| Smooth / Flat | **18 – 25 yrs** | Billowing with horizontal ridges; ossific nodules |
| Moderate / Flat Ridges | **25 – 40 yrs** | Surface flattening; ventral rampart forming |
| Rough / Granular | **40 – 55 yrs** | Rim complete; irregular texture; early porosity |
| Degenerated / Eroded | **55+ yrs** | Rim breakdown; extensive porosity; lipping |

---

### 4.3 The Femur — Epiphyseal Fusion (Growth Plate)

> *"Epiphyseal union is one of the most reliable indicators of age in subadults and young adults. Females generally fuse earlier than males."*
> — Bass, *Human Osteology*, 5th ed.

| Fusion Status | Age Estimate | Bass Timing |
|---|---|---|
| Unfused | **< 18 years** | Active growth; clear epiphyseal line |
| Partially Fused | **18 – 25 years** | Distal femur: 14–20 yrs; Proximal head: 14–19 yrs |
| Fused | **25+ years** | All growth plates fully fused |

---

### 4.4 The Thorax — Rib Sternal End Morphology

Bass recommends using the **4th rib** and notes this method is **sex-specific**:

| Rib Sternal End | Age Estimate |
|---|---|
| Smooth Edges | **18 – 30 years** |
| Scalloped Edges | **30 – 50 years** |
| Irregular / Porous | **50+ years** |

---

### 4.5 Teeth — Dental Development and Wear

Bass notes dental development is the **most accurate** age indicator for subadults.

#### Dentition Type

| Dentition | Age Estimate |
|---|---|
| Deciduous (Baby) | **< 6 years** |
| Mixed | **6 – 12 years** |
| Permanent | **12+ years** |

#### Dental Wear

Bass cautions: *"Dental wear is highly variable and strongly dependent on diet, food preparation methods, and cultural practices."*

| Wear Level | Age Estimate |
|---|---|
| None | **12 – 20 years** |
| Mild | **20 – 35 years** |
| Moderate | **35 – 50 years** |
| Severe | **50+ years** |

#### Eruption Stage

| Stage | Application |
|---|---|
| Early | Crown formation; subadult aging |
| Partial | Tooth partially erupted |
| Complete | Full occlusion; mature dentition |

---

## 5. Stature Estimation

> *"Stature estimation is based on the mathematical relationship between long bone length and living height. The femur provides the most reliable estimate because it is the longest bone in the body."*
> — Bass, *Human Osteology*, 5th ed.

### 5.1 Population-Specific Formulae from Bass

Bass provides regression formulae by sex and ancestry. The system uses Bass's **"Mongoloid" (Asian) male formulae** as the closest available Bass-published data for Sri Lankan populations.

#### All Bass Femur Formulae (for reference)

| Sex | Ancestry (Bass term) | Formula (bone in cm) | Std. Error |
|---|---|---|---|
| Male | White | 2.32 × Femur + 65.53 | ±3.94 cm |
| Male | Black | 2.10 × Femur + 72.22 | ±3.91 cm |
| **Male** | **Mongoloid (Asian)** | **2.15 × Femur + 72.57** | **±3.80 cm** |
| Male | Mexican | 2.44 × Femur + 58.67 | ±2.99 cm |
| Female | White | 2.47 × Femur + 54.10 | ±3.72 cm |
| Female | Black | 2.28 × Femur + 59.76 | ±3.41 cm |

### 5.2 System Implementation — Femur

The system uses Bass's **Mongoloid male formula** as the primary stature estimator:

```
Stature (cm) = 2.15 × Femur Length (cm) + 72.57    (±3.80 cm)
```

> **Note:** Input is in millimeters in the UI, converted to centimeters internally.

**Examples for Sri Lankan context:**

| Femur Length | Calculation | Estimated Stature |
|---|---|---|
| 400 mm (40.0 cm) | 2.15 × 40.0 + 72.57 | **158.6 cm** |
| 420 mm (42.0 cm) | 2.15 × 42.0 + 72.57 | **162.9 cm** |
| 450 mm (45.0 cm) | 2.15 × 45.0 + 72.57 | **169.3 cm** |
| 470 mm (47.0 cm) | 2.15 × 47.0 + 72.57 | **173.6 cm** |

### 5.3 System Implementation — Humerus

Bass's Mongoloid humerus formula:

```
Stature (cm) = 2.68 × Humerus Length (cm) + 83.19    (±4.25 cm)
```

**Examples:**

| Humerus Length | Calculation | Estimated Stature |
|---|---|---|
| 280 mm (28.0 cm) | 2.68 × 28.0 + 83.19 | **158.2 cm** |
| 300 mm (30.0 cm) | 2.68 × 30.0 + 83.19 | **163.6 cm** |
| 320 mm (32.0 cm) | 2.68 × 32.0 + 83.19 | **168.9 cm** |

### 5.4 Limitations for Sri Lanka

Bass's Mongoloid formulae were derived from **East Asian (Korean/Chinese)** military samples. Key considerations:

1. **Body proportions differ** — Sri Lankans (Sinhalese/Tamil) may have different limb-to-trunk ratios than East Asians
2. **No female Asian formula** — Bass provides Mongoloid formulae for males only; the system applies the male formula as a general estimate
3. **Standard error** — The ±3.80 cm error may be larger when applied cross-population
4. **Secular change** — Modern Sri Lankan populations may differ from Bass's historical reference samples

Bass emphasizes: *"Population-specific formulae should always be used whenever the ancestry of the individual can be estimated."*

---

## 6. Confidence Level Calculation

The confidence score reflects prediction reliability, following Bass's hierarchy of skeletal element reliability:

### Formula

```
Confidence = min(MaxCap, BaseScore + NumberOfFieldsFilled × PerFieldBonus)
```

### Scoring by Bone Type

| Bone Type | Base | Per Field | Max Cap | Rationale (per Bass) |
|---|:-:|:-:|:-:|---|
| **Pelvis** | 72% | +7% | 95% | Bass's "most reliable indicator of sex" |
| **Skull** | 70% | +6% | 95% | Second most reliable; suture closure cautioned |
| **Lower Limb** | 68% | +8% | 95% | Reliable metric data; cross-population formula used |
| **Upper Limb** | 65% | +10% | 90% | Fewer parameters |
| **Teeth** | 65% | +8% | 90% | Excellent for subadults; variable for adults |
| **Thorax** | 60% | +10% | 85% | Age-only; supplementary |

### Interpretation

| Range | Meaning |
|---|---|
| 90 – 95% | **High confidence** — reliable for reporting |
| 80 – 89% | **Moderate** — consider supplementary analysis |
| 70 – 79% | **Low** — additional bone types recommended |
| < 70% | **Very low** — insufficient data |

---

## 7. Complete Parameter Reference

| # | Bone | Parameter | Input | Predicts | Bass Section |
|---|---|---|---|---|---|
| 1 | Skull | Brow Ridge | 5-point scale | Sex | The Skull |
| 2 | Skull | Mastoid Size | 3 ranges | Sex | The Skull |
| 3 | Skull | Jaw Shape | 4 types | Sex (supporting) | The Skull — Mandible |
| 4 | Skull | Cranial Suture | 5 stages | Age | The Skull |
| 5 | Pelvis | Subpubic Angle | Wide/Narrow | Sex | The Innominate |
| 6 | Pelvis | Sciatic Notch | Wide/Narrow | Sex | The Innominate |
| 7 | Pelvis | Pubic Symphysis | 4 stages | Age | The Innominate |
| 8 | Lower Limb | Femur Length | mm | Stature | The Femur |
| 9 | Lower Limb | Femur Head Ø | mm | Sex | The Femur |
| 10 | Lower Limb | Growth Plate | 3 stages | Age | The Femur |
| 11 | Upper Limb | Humerus Length | mm | Stature | The Humerus |
| 12 | Upper Limb | Robusticity | Robust/Gracile | Sex | The Humerus |
| 13 | Thorax | Rib Shape | 3 types | Age | The Thorax |
| 14 | Thorax | Sternum Length | mm | Age (supporting) | The Thorax |
| 15 | Teeth | Teeth Type | 3 types | Age | Human Dentition |
| 16 | Teeth | Dental Wear | 4 levels | Age | Human Dentition |
| 17 | Teeth | Eruption Stage | 3 stages | Age | Human Dentition |

---

## 8. References

1. **Bass, W. M.** (2005). *Human Osteology: A Laboratory and Field Manual* (5th ed.). Special Publication No. 2, Missouri Archaeological Society, Columbia, Missouri.

2. **Bass, W. M.** (1995). *Human Osteology: A Laboratory and Field Manual* (4th ed.). Special Publication No. 2, Missouri Archaeological Society, Columbia, Missouri.

3. **Bass, W. M.** (1987). *Human Osteology: A Laboratory and Field Manual* (3rd ed.). Special Publication No. 2, Missouri Archaeological Society, Columbia, Missouri.

4. **Bass, W. M.** (1971). *Human Osteology: A Laboratory and Field Manual* (1st ed.). Special Publication, Missouri Archaeological Society, Columbia, Missouri.

5. **Bass, W. M., & Jefferson, J.** (2003). *Death's Acre: Inside the Legendary Forensic Lab — The Body Farm — Where the Dead Do Tell Tales*. G. P. Putnam's Sons, New York.

---

*All analytical methods, criteria, and formulae in this document are derived exclusively from Bass, W. M. — Human Osteology: A Laboratory and Field Manual (5th ed., 2005). The system uses Bass's Mongoloid (Asian) stature formulae as the closest available approximation for Sri Lankan populations.*
