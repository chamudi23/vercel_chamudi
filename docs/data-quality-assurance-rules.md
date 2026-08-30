# Data Quality Assurance Rules

## 1. Purpose

The Data Quality page uses transparent, rule-based checks. It does not use AI to guess or change archaeological data. A rule only reports a problem or asks the user to review a value. Corrections must be supported by the source documentation.

The main rule engine is [`dataQualityRules.js`](../src/utils/dataQualityRules.js#L1). The page runs it for specimen, measurement, and Sites records in [`DataQualityPage.jsx`](../src/pages/DataQualityPage.jsx#L208).

## 2. How results are classified

The available severities are `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, and `INFO` ([line 11](../src/utils/dataQualityRules.js#L11)).

- **Error:** normally a `CRITICAL` or `HIGH` invalid value.
- **Warning:** a review item, or a `MEDIUM`, `LOW`, or `INFO` issue.
- **Valid:** no rule was triggered for the record.

The exact status mapping is implemented at [lines 87–102](../src/utils/dataQualityRules.js#L87). A warning is not proof that the data is wrong. It asks the user to verify the value against the archaeological record.

## 3. Sites record rules

### Required fields and classifications

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `SITE-STRUCT-001` | Critical | A site must have a generated site ID. | `site_id` is empty instead of a value such as `SITE_014`. | [Line 155](../src/utils/dataQualityRules.js#L155) |
| `SITE-STRUCT-002` | High | A site must have a name. | `site_name` is empty. | [Line 156](../src/utils/dataQualityRules.js#L156) |
| `SITE-STRUCT-003` | High | The time period must be one of the supported Sites options. | `time_period = "Modern"`, which is not in the Sites list. | [Line 157](../src/utils/dataQualityRules.js#L157) |
| `SITE-OPTION-DISTRICT` | High | If a district is entered, it must be a supported district. | `district = "Unknown District"`. | [Line 173](../src/utils/dataQualityRules.js#L173) |
| `SITE-OPTION-PROVINCE` | High | If a province is entered, it must be a supported province. | `province = "Central Area"` instead of a controlled province value. | [Line 173](../src/utils/dataQualityRules.js#L173) |
| `SITE-OPTION-SITE_TYPE` | High | If a site type is entered, it must be a supported type. | `site_type = "Museum"`. | [Line 173](../src/utils/dataQualityRules.js#L173) |
| `SITE-OPTION-RISK_LEVEL` | High | Risk must be `High`, `Medium`, or `Low`. | `risk_level = "Severe"`. | [Line 173](../src/utils/dataQualityRules.js#L173) |
| `SITE-OPTION-PROTECTED_STATUS` | High | Protected status must be `Protected`, `Not Protected`, or `Unknown`. | `protected_status = "Partly Protected"`. | [Line 173](../src/utils/dataQualityRules.js#L173) |

Supported Sites time periods, site types, risk levels, and protected statuses are declared at [lines 32–44](../src/utils/dataQualityRules.js#L32).

### Coordinates and excavation year

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `SITE-LOCATION-001` | High | Latitude must be from -90 to 90. | `latitude = 95.2`. | [Line 159](../src/utils/dataQualityRules.js#L159) |
| `SITE-LOCATION-002` | High | Longitude must be from -180 to 180. | `longitude = 205`. | [Line 160](../src/utils/dataQualityRules.js#L160) |
| `SITE-LOCATION-003` | Medium warning | Record both latitude and longitude, or leave both unknown. | Latitude is `7.29`, but longitude is empty. | [Line 161](../src/utils/dataQualityRules.js#L161) |
| `SITE-CONTEXT-001` | High | A Sites excavation year must be a whole year from 1800 through the current year. | `excavation_year = 1795`, `2025.5`, or a future year. | [Line 165](../src/utils/dataQualityRules.js#L165) |

### Duplicates and completeness

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `SITE-DUPLICATE-001` | Critical | Each site ID must occur only once. | Two rows both use `SITE_014`. | [Line 176](../src/utils/dataQualityRules.js#L176) |
| `SITE-DUPLICATE-002` | Medium warning | Repeated site names must be reviewed. Matching ignores case and surrounding spaces. | `Ibbankatuwa` and ` ibbankatuwa ` occur in two Sites rows. | [Line 177](../src/utils/dataQualityRules.js#L177) |
| `SITE-COMPLETE-001` | Low or medium warning | Report missing tracked Sites details. Seven or more missing fields produce medium severity; fewer produce low severity. | A site has a name and ID but no coordinates, classification, risk, description, or image. | [Lines 66–70](../src/utils/dataQualityRules.js#L66), [179–180](../src/utils/dataQualityRules.js#L179) |

## 4. Specimen structural and anatomical rules

### Required and controlled values

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `STRUCT-001` | Critical | Every specimen must have a specimen ID. | `specimen_id` is empty. | [Line 220](../src/utils/dataQualityRules.js#L220) |
| `STRUCT-002` | High | Every specimen must have a skeleton code. | `skeleton_code` is empty. | [Line 221](../src/utils/dataQualityRules.js#L221) |
| `STRUCT-003` | High | Every specimen must have a bone category. | `bone_type` is empty. | [Line 222](../src/utils/dataQualityRules.js#L222) |
| `ANATOMY-001` | High | Bone category must come from the controlled catalogue. | `bone_type = "Leg Bone"` instead of `Femur`, `Tibia`, or another supported category. | [Line 223](../src/utils/dataQualityRules.js#L223) |
| `SIDE-001` | High | Side must agree with the bone category. Midline bones use `Midline`; paired bones use `Left`, `Right`, or `Unknown`. | A `Skull` is recorded as `Left`, or a `Femur` is recorded as `Midline`. | [Lines 225–227](../src/utils/dataQualityRules.js#L225) |
| `STRUCT-OPTION-DISTRICT` | High | If entered, specimen district must be a controlled value. | `district = "North Area"`. | [Line 234](../src/utils/dataQualityRules.js#L234) |
| `STRUCT-OPTION-PROVINCE` | High | If entered, specimen province must be a controlled value. | `province = "Western Area"` instead of the supported province name. | [Line 234](../src/utils/dataQualityRules.js#L234) |
| `STRUCT-OPTION-PRESERVATION_STATE` | High | If entered, preservation state must be a controlled value. | `preservation_state = "Almost good"`. | [Line 234](../src/utils/dataQualityRules.js#L234) |
| `STRUCT-OPTION-TIME_PERIOD` | High | If entered, time period must be supported by the specimen or Sites forms. | `time_period = "Unknown Dynasty"`. | [Line 236](../src/utils/dataQualityRules.js#L236) |

The controlled bone catalogue and its side rules are defined in [`pp1ImageModule.js`](../src/utils/pp1ImageModule.js#L7).

### Specimen dates and dimensions

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `CONTEXT-001` | High | Specimen excavation year must be a positive whole year and cannot be in the future. | `excavation_year = -20`, `2020.5`, or current year + 1. | [Lines 238–240](../src/utils/dataQualityRules.js#L238) |
| `CONTEXT-002` | Low warning | A specimen year earlier than 1800 needs manual review. It may remain if documentation supports it. | `excavation_year = 1750`. | [Line 241](../src/utils/dataQualityRules.js#L241) |
| `MEASURE-001` | High | `length_cm`, `width_cm`, and `thickness_cm`, when entered, must be positive numbers. | `length_cm = 0` or `width_cm = -4`. | [Lines 244–247](../src/utils/dataQualityRules.js#L244) |
| `MEASURE-002` | Medium warning | A specimen dimension over 300 cm needs review. | `length_cm = 350`, possibly caused by entering millimetres as centimetres. | [Line 248](../src/utils/dataQualityRules.js#L248) |
| `MEASURE-012` | High | Height estimate, when entered, must be a positive number. | `height_estimate = 0` or `"unknown"`. | [Line 250](../src/utils/dataQualityRules.js#L250) |

The 300 cm limit is a conservative QA review threshold, not an anatomical diagnosis.

## 5. Duplicate and cross-specimen rules

### Duplicate specimen records

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `DUPLICATE-001` | Critical | A specimen ID must occur only once. | Two returned records use `CHASA-954`. | [Line 252](../src/utils/dataQualityRules.js#L252) |
| `DUPLICATE-002` | High | For bone categories marked unique per side, one skeleton should not have the same bone and side more than once. Fragment-capable categories are exempt. | Skeleton `SK-10` has two `Left Femur` records. | [Lines 253–255](../src/utils/dataQualityRules.js#L253) |

The categories marked unique per side include clavicle, scapula, humerus, radius, ulna, pelvis, femur, patella, tibia, and fibula ([catalogue lines 15–30](../src/utils/pp1ImageModule.js#L15)).

### Records sharing one skeleton code

All non-empty context values for specimens with the same normalized skeleton code should agree. These are high-severity review warnings because the system must not decide which source value is correct.

| Rule ID | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|
| `SKELETON-SITE_NAME` | Same skeleton, same site name. | Two `SK-10` specimens use `Anuradhapura` and `Polonnaruwa`. | [Lines 258–261](../src/utils/dataQualityRules.js#L258) |
| `SKELETON-DISTRICT` | Same skeleton, same district. | Two `SK-10` specimens use `Anuradhapura` and `Kandy` districts. | [Lines 258–261](../src/utils/dataQualityRules.js#L258) |
| `SKELETON-PROVINCE` | Same skeleton, same province. | Two `SK-10` specimens use `North Central` and `Central`. | [Lines 258–261](../src/utils/dataQualityRules.js#L258) |
| `SKELETON-EXCAVATION_YEAR` | Same skeleton, same excavation year. | Two `SK-10` specimens use `2018` and `2019`. | [Lines 258–261](../src/utils/dataQualityRules.js#L258) |
| `SKELETON-TIME_PERIOD` | Same skeleton, same time period. | Two `SK-10` specimens use `Iron Age` and `Medieval`. | [Lines 258–261](../src/utils/dataQualityRules.js#L258) |

## 6. Specimen-to-Sites consistency rules

Matching uses the normalized `site_name`, meaning differences in case and surrounding spaces are ignored ([lines 205–209](../src/utils/dataQualityRules.js#L205)).

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `SITE-LINK-001` | Medium warning | A non-empty specimen site name should match a record in Sites. | Specimen uses `Unknown Cave`, but Sites contains no matching name. | [Line 268](../src/utils/dataQualityRules.js#L268) |
| `SITE-LINK-002` | Medium warning | A specimen site name should resolve to only one Sites record. | Two Sites rows are both named `Ibbankatuwa`. | [Line 269](../src/utils/dataQualityRules.js#L269) |
| `SITE-CONTEXT-DISTRICT` | High warning | Specimen district should match the single matching Sites record when both values exist. | Specimen says `Kandy`; Sites says `Matale`. | [Lines 270–273](../src/utils/dataQualityRules.js#L270) |
| `SITE-CONTEXT-PROVINCE` | High warning | Specimen province should match Sites when both values exist. | Specimen says `Central`; Sites says `North Central`. | [Lines 270–273](../src/utils/dataQualityRules.js#L270) |
| `SITE-CONTEXT-EXCAVATION_YEAR` | High warning | Specimen excavation year should match Sites when both values exist. | Specimen says `2019`; Sites says `2018`. | [Lines 270–273](../src/utils/dataQualityRules.js#L270) |
| `SITE-CONTEXT-TIME_PERIOD` | High warning | Specimen time period should match Sites when both values exist. | Specimen says `Medieval`; Sites says `Iron Age`. | [Lines 270–273](../src/utils/dataQualityRules.js#L270) |

These rules compare records; they do not automatically copy or overwrite a value.

## 7. Completeness rules

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `COMPLETE-000` | Low warning | Report missing tracked specimen context fields. | `location_stored`, `burial_context`, and `notes` are empty. | [Lines 277–279](../src/utils/dataQualityRules.js#L277) |
| `COMPLETE-001` | Low warning | Report a specimen with no measurement rows. | Specimen `SP-100` has no record in `measurements`. | [Line 280](../src/utils/dataQualityRules.js#L280) |

The tracked specimen fields are site name, district, province, excavation year, time period, preservation state, storage location, burial context, and notes ([lines 62–65](../src/utils/dataQualityRules.js#L62)). A separate completeness percentage gives equal weight to those nine fields ([`dataQuality.js`, lines 1–23](../src/lib/dataQuality.js#L1)).

## 8. Measurement record rules

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `MEASURE-003` | High | A measurement must have a valid controlled bone category. | A measurement has an empty bone, or `bone_type = "Long Bone"`. | [Line 288](../src/utils/dataQualityRules.js#L288) |
| `ANATOMY-002` | High | Measurement bone must match its parent specimen bone. | A Femur specimen contains a measurement labelled Tibia. | [Line 289](../src/utils/dataQualityRules.js#L289) |
| `ANATOMY-003` | High | A bone-qualified measurement type must be compatible with its bone. | A Femur measurement uses a type explicitly qualified for the Tibia. | [Line 290](../src/utils/dataQualityRules.js#L290) |
| `MEASURE-004` | High | Measurement type must be one of the form options. | `measurement_type = "Random Size"`. | [Line 291](../src/utils/dataQualityRules.js#L291) |
| `MEASURE-005` | High | A numeric measurement must include a unit. | `value = 45.2`, but `unit` is empty. | [Line 292](../src/utils/dataQualityRules.js#L292) |
| `MEASURE-006` | High | Unit must be `mm`, `cm`, or `m`. | `unit = "inches"`. | [Line 293](../src/utils/dataQualityRules.js#L293) |
| `MEASURE-007` | High | Measurement value must be a positive number. | `value = 0`, `-12`, or non-numeric text. | [Line 294](../src/utils/dataQualityRules.js#L294) |
| `MEASURE-008` | Medium warning | After converting `mm` or `m` to centimetres, a value over 300 cm needs review. | `value = 350 cm`, `3500 mm`, or `3.5 m`. | [Lines 295–297](../src/utils/dataQualityRules.js#L295) |

Supported measurement types and units are declared at [lines 25–30](../src/utils/dataQualityRules.js#L25). The system checks units but does not automatically rewrite the saved source value.

## 9. Cross-table reference rule

| Rule ID | Severity | Simple rule | Example that triggers the rule | Code |
|---|---|---|---|---|
| `STRUCT-REF-001` | Critical | Every measurement must reference a specimen returned by the specimen query. | A measurement uses `specimen_id = "SP-404"`, but no `SP-404` specimen exists. | [Lines 304–308](../src/utils/dataQualityRules.js#L304) |

This is a reporting rule only. It does not delete or repair the orphan row.

## 10. Scores shown on the Data Quality page

### Category scores

Each category starts at 100. Every triggered issue subtracts a fixed amount:

| Severity | Penalty |
|---|---:|
| Critical | 25 |
| High | 15 |
| Medium | 7 |
| Low | 3 |
| Info | 1 |

The score cannot go below zero. The penalties and formula are at [lines 49–50](../src/utils/dataQualityRules.js#L49) and [118–124](../src/utils/dataQualityRules.js#L118).

Example: a category with one High issue and two Low issues scores `100 - 15 - 3 - 3 = 79`.

### Overall health score

The page combines average specimen completeness, duplicate status, error status, the proportion of very incomplete specimens, and a capped warning penalty. The formula is at [`DataQualityPage.jsx`, lines 304–313](../src/pages/DataQualityPage.jsx#L304).

This score is a dashboard indicator. It is not scientific confidence, a probability, or an automated archaeological conclusion.

## 11. Important limitations

- The checks evaluate records returned to the page. Permissions or query failures can therefore affect what can be compared.
- The specimen-to-site link currently uses the site name, not a site foreign-key ID.
- The 1800 and 300 cm thresholds are review heuristics.
- Empty optional values can create completeness warnings but are not automatically treated as incorrect.
- The rules never decide which conflicting archaeological source is correct and never automatically repair a record.

