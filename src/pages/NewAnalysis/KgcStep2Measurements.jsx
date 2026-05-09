import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SkeletalHeader from '../../components/KgcSkeletalHeader';
import { useAnalysis } from '../../context/AnalysisContext';

// Measurement configurations per bone type based on osteoarchaeological analysis
const measurementConfig = {
  Skull: {
    title: 'Skull Measurements',
    predicts: { browRidge: 'Sex', mastoidSize: 'Sex', jawShape: 'Age', cranialSuture: 'Age' },
    fields: [
      { key: 'browRidge', label: 'Brow Ridge', type: 'select', options: [
        { l: 'Smooth', v: 'smooth' }, { l: 'Less Developed', v: 'less-developed' }, { l: 'Moderate', v: 'moderate' }, { l: 'Prominent', v: 'prominent' }, { l: 'Thick', v: 'thick' }
      ]},
      { key: 'mastoidSize', label: 'Mastoid Size', type: 'select', options: [
        { l: '< 25mm', v: 'less-25mm' }, { l: '25 - 30mm', v: '25-30mm' }, { l: '> 30mm', v: 'more-30mm' }
      ]},
      { key: 'jawShape', label: 'Jaw Shape', type: 'select', options: [
        { l: 'U Shaped Jaw', v: 'u-shaped' }, { l: 'V Shaped Jaw', v: 'v-shaped' }, { l: 'Robust Jaw', v: 'robust' }, { l: 'Rounded Jaw', v: 'rounded' }
      ]},
      { key: 'cranialSuture', label: 'Cranial Suture', type: 'select', options: [
        { l: 'Open', v: 'open' }, { l: 'Partially Open', v: 'partially-open' }, { l: 'Moderate Closure', v: 'moderate-closure' }, { l: 'Mostly Closed', v: 'mostly-closed' }, { l: 'Completely Closed', v: 'completely-closed' }
      ]},
    ],
  },
  Pelvis: {
    title: 'Pelvis Measurements',
    predicts: { subpubicAngle: 'Height', sciaticNotch: 'Sex', pubicSymphysis: 'Age' },
    fields: [
      { key: 'subpubicAngle', label: 'Subpubic Angle', type: 'select', options: [
        { l: 'Wide (> 90°)', v: 'wide' }, { l: 'Narrow (< 90°)', v: 'narrow' }
      ]},
      { key: 'sciaticNotch', label: 'Sciatic Notch', type: 'select', options: [
        { l: 'Wide', v: 'wide' }, { l: 'Narrow', v: 'narrow' }
      ]},
      { key: 'pubicSymphysis', label: 'Pubic Symphysis', type: 'select', options: [
        { l: 'Smooth / Flat', v: 'smooth-flat' },
        { l: 'Moderate / Flat Ridges', v: 'moderate-flat-ridges' },
        { l: 'Rough / Granular', v: 'rough-granular' },
        { l: 'Degenerated / Eroded', v: 'degenerated-eroded' },
      ]},
    ],
  },
  'Lower Limb': {
    title: 'Lower Limb Measurements',
    predicts: { femurLength: 'Height', femurHeadDiameter: 'Sex', growthPlate: 'Age' },
    fields: [
      { key: 'femurLength', label: 'Femur Length (mm)', type: 'number', placeholder: 'e.g. 450' },
      { key: 'femurHeadDiameter', label: 'Femur Head Diameter (mm)', type: 'number', placeholder: 'e.g. 45' },
      { key: 'growthPlate', label: 'Growth Plate', type: 'select', options: [
        { l: 'Fused', v: 'fused' }, { l: 'Partially Fused', v: 'partially-fused' }, { l: 'Unfused', v: 'unfused' }
      ]},
    ],
  },
  'Upper Limb': {
    title: 'Upper Limb Measurements',
    predicts: { humerusLength: 'Height', boneRobusticity: 'Sex' },
    fields: [
      { key: 'humerusLength', label: 'Humerus Length (mm)', type: 'number', placeholder: 'e.g. 320' },
      { key: 'boneRobusticity', label: 'Bone Robusticity', type: 'select', options: [
        { l: 'Robust', v: 'robust' }, { l: 'Gracile', v: 'gracile' }
      ]},
    ],
  },
  Thorax: {
    title: 'Thorax Measurements',
    predicts: { ribShape: 'Age', sternumLength: 'Age' },
    fields: [
      { key: 'ribShape', label: 'Rib Shape', type: 'select', options: [
        { l: 'Smooth Edges', v: 'smooth' }, { l: 'Scalloped Edges', v: 'scalloped' }, { l: 'Irregular / Porous', v: 'irregular' }
      ]},
      { key: 'sternumLength', label: 'Sternum Length (mm)', type: 'number', placeholder: 'e.g. 170' },
    ],
  },
  Teeth: {
    title: 'Teeth Data',
    predicts: { teethType: 'Age', dentalWear: 'Age', eruptionStage: 'Age' },
    fields: [
      { key: 'teethType', label: 'Teeth Type', type: 'select', options: [
        { l: 'Deciduous (Baby)', v: 'deciduous' }, { l: 'Permanent', v: 'permanent' }, { l: 'Mixed', v: 'mixed' }
      ]},
      { key: 'dentalWear', label: 'Dental Wear', type: 'select', options: [
        { l: 'None', v: 'none' }, { l: 'Mild', v: 'mild' }, { l: 'Moderate', v: 'moderate' }, { l: 'Severe', v: 'severe' }
      ]},
      { key: 'eruptionStage', label: 'Eruption Stage', type: 'select', options: [
        { l: 'Early', v: 'early' }, { l: 'Partial', v: 'partial' }, { l: 'Complete', v: 'complete' }
      ]},
    ],
  },
};

// Badge colors for prediction types
const predictBadge = {
  Sex: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Age: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Height: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function Step2Measurements() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setMeasurements } = useAnalysis();
  const bonesType = searchParams.get('bonesType') || 'Skull';
  const config = measurementConfig[bonesType] || measurementConfig.Skull;

  const { register, handleSubmit, formState: { errors } } = useForm();
  const onSubmit = (data) => {
    // Save all measurements to shared context
    setMeasurements(bonesType, data);
    navigate(`/skeletal/analysis/step3?bonesType=${encodeURIComponent(bonesType)}`);
  };

  const steps = ['Basic Information', 'Skeletal Measurements', 'Review & Predict'];
  const sc = (e) => `w-full bg-slate-900 border ${e ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors appearance-none`;

  return (
    <div className="max-w-4xl mx-auto">
      <SkeletalHeader title={config.title} subtitle={`Step 2 of 3 — Enter ${bonesType.toLowerCase()} measurements`} />
      <div className="px-6 pb-12">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${i < 2 ? (i === 1 ? 'bg-orange-500 border-orange-500 text-white' : 'bg-blue-500 border-blue-500 text-white') : 'border-slate-600 text-slate-500'}`}>{i + 1}</div>
              <span className={`text-sm font-medium ${i === 1 ? 'text-orange-400' : i < 1 ? 'text-slate-300' : 'text-slate-500'}`}>{step}</span>
              {i < 2 && <div className="w-12 h-px bg-slate-600" />}
            </div>
          ))}
        </div>

        {/* Selected Bone Type Badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-slate-400 text-sm">Selected Bone Type:</span>
          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            {bonesType}
          </span>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
          <h3 className="text-slate-100 text-xl font-semibold mb-2">{config.title}</h3>
          <p className="text-slate-500 text-sm mb-6">Fill in the measurement values for each field. Each measurement contributes to a specific prediction.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-400 text-sm">{field.label}</label>
                  </div>
                  {field.type === 'select' ? (
                    <select className={sc(errors[field.key])} {...register(field.key, { required: 'Required' })}>
                      <option value="">Select an option</option>
                      {field.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      className={sc(errors[field.key])}
                      {...register(field.key, { required: 'Required' })}
                    />
                  )}
                  {errors[field.key] && <span className="text-red-400 text-xs mt-1 block">{errors[field.key].message}</span>}
                </div>
              ))}
            </div>

            {/* Guide section */}
            <div className="border-t border-slate-700 pt-6">
              <h4 className="text-slate-200 font-medium mb-3">Guide For {bonesType} Measurements</h4>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-slate-500 text-sm leading-relaxed">
                {bonesType === 'Skull' && 'Examine the brow ridge prominence, mastoid process size behind the ear, jaw angle shape, and cranial suture closure pattern to determine sex and age.'}
                {bonesType === 'Pelvis' && 'Measure the subpubic angle width, greater sciatic notch shape, and pubic symphysis surface texture. Symphysis stages: Smooth/Flat (young), Ridged (middle), Granular (older), Eroded (elderly).'}
                {bonesType === 'Lower Limb' && 'Measure femur maximum length and head diameter with calipers. Check growth plate fusion status at the distal and proximal ends of the femur.'}
                {bonesType === 'Upper Limb' && 'Measure humerus maximum length with an osteometric board. Assess bone robusticity by examining muscle attachment sites and cortical bone thickness.'}
                {bonesType === 'Thorax' && 'Examine rib sternal end morphology for age indicators. Measure sternum length from manubrium to xiphoid process.'}
                {bonesType === 'Teeth' && 'Identify teeth as deciduous, permanent, or mixed dentition. Assess dental wear on occlusal surfaces and eruption stage of third molars.'}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => navigate('/skeletal/analysis/new')} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">← Back</button>
              <button type="submit" className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">Next →</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
