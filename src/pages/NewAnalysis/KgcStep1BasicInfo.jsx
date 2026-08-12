/**
 * KgcStep1BasicInfo.jsx
 * =====================
 * Step 1 of 3: Basic Information entry for a new skeletal analysis.
 *
 * The analysis is held in AnalysisContext through the wizard and persisted
 * once, at Step 3, via analysisStore (the `analyses` table). Step 1 only
 * generates the Case ID and records the basic info in context.
 */

import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import SkeletalHeader from '../../components/KgcSkeletalHeader';
import { useAnalysis } from '../../context/AnalysisContext';

export default function Step1BasicInfo() {
  const navigate = useNavigate();
  const { currentCaseId, setBasicInfo, startNewAnalysis } = useAnalysis();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Generate a fresh case ID when starting a new analysis
  useEffect(() => {
    startNewAnalysis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (data) => {
    setBasicInfo(data);
    navigate(`/skeletal/analysis/step2?bonesType=${encodeURIComponent(data.bonesType)}`);
  };

  const steps = ['Basic Information', 'Skeletal Measurements', 'Review & Predict'];
  const ic = (e) => `w-full bg-slate-900 border ${e ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors`;

  return (
    <div className="max-w-4xl mx-auto">
      <SkeletalHeader title="New Analysis" subtitle="Step 1 of 3 — Enter basic specimen information" />
      <div className="px-6 pb-12">
        <div className="flex items-center justify-center gap-4 mb-10">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${i === 0 ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-600 text-slate-500'}`}>{i + 1}</div>
              <span className={`text-sm font-medium ${i === 0 ? 'text-orange-400' : 'text-slate-500'}`}>{step}</span>
              {i < 2 && <div className="w-12 h-px bg-slate-600" />}
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
          <h3 className="text-slate-100 text-xl font-semibold mb-6">Enter Basic Information</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-slate-400 text-sm mb-1.5 block">Case ID <span className="text-emerald-400 text-xs ml-1">(auto-generated)</span></label>
                <input
                  readOnly
                  value={currentCaseId}
                  className="w-full bg-slate-950 border border-slate-600 rounded-lg px-4 py-2 text-emerald-400 font-mono font-semibold tracking-wide cursor-not-allowed focus:outline-none"
                />
              </div>
              <div><label className="text-slate-400 text-sm mb-1.5 block">User Name</label><input className={ic(errors.userName)} placeholder="Chamudi Gayeshika" {...register('userName', { required: 'Required' })} /></div>
              <div><label className="text-slate-400 text-sm mb-1.5 block">Bones Type</label><select className={ic(errors.bonesType)} {...register('bonesType', { required: 'Required' })}><option value="">Select Bone Type</option><option value="Skull">Skull</option><option value="Pelvis">Pelvis</option><option value="Upper Limb">Upper Limb</option><option value="Lower Limb">Lower Limb</option><option value="Thorax">Thorax</option><option value="Teeth">Teeth</option></select>{errors.bonesType && <span className="text-red-400 text-xs mt-1">{errors.bonesType.message}</span>}</div>
              <div><label className="text-slate-400 text-sm mb-1.5 block">Location</label><input className={ic(errors.location)} placeholder="Kottawa" {...register('location', { required: 'Required' })} /></div>
              <div><label className="text-slate-400 text-sm mb-1.5 block">Date Found</label><input type="date" style={{ colorScheme: 'dark' }} className={ic(errors.dateFound)} {...register('dateFound', { required: 'Required' })} /></div>
              <div><label className="text-slate-400 text-sm mb-1.5 block">Analysis Date</label><input type="date" style={{ colorScheme: 'dark' }} defaultValue={new Date().toISOString().split('T')[0]} className={ic(errors.analysisDate)} {...register('analysisDate', { required: 'Required' })} /></div>
              <div className="md:col-span-2"><label className="text-slate-400 text-sm mb-1.5 block">Email</label><input type="email" className={ic(false)} placeholder="chamudi@gmail.com" {...register('email')} /></div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">Next →</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
