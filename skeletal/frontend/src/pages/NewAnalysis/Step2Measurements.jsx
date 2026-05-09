import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Stepper from '../../components/common/Stepper';
import FormSelect from '../../components/common/FormSelect';
import Button from '../../components/common/Button';

export default function Step2Measurements() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    navigate('/analysis/new/step3');
  };

  const steps = [
    { label: 'Basic Information' },
    { label: 'Skeletal Measurements' },
    { label: 'Review & Predict' }
  ];

  const browRidgeOptions = [
    { label: 'Prominent', value: 'prominent' },
    { label: 'Smooth', value: 'smooth' }
  ];
  const jawShapeOptions = [
    { label: 'Square', value: 'square' },
    { label: 'V-Shape', value: 'v-shape' }
  ];
  const nuchalCrestOptions = [
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' }
  ];
  const mastoidSizeOptions = [
    { label: 'Large', value: 'large' },
    { label: 'Small', value: 'small' }
  ];
  const cranialSutureOptions = [
    { label: 'Closed', value: 'closed' },
    { label: 'Open', value: 'open' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <Stepper steps={steps} currentStep={2} />

      <div className="bg-dark-card rounded-2xl border border-dark-border/50 shadow-sm p-8 mt-8">
        <h2 className="text-white text-xl font-semibold mb-6">Skull Measurements</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              label="Brow Ridge"
              id="browRidge"
              options={browRidgeOptions}
              {...register('browRidge', { required: 'Required' })}
              error={errors.browRidge?.message}
            />
            <FormSelect
              label="Jaw Shape"
              id="jawShape"
              options={jawShapeOptions}
              {...register('jawShape', { required: 'Required' })}
              error={errors.jawShape?.message}
            />
            <FormSelect
              label="Nuchal Crest"
              id="nuchalCrest"
              options={nuchalCrestOptions}
              {...register('nuchalCrest', { required: 'Required' })}
              error={errors.nuchalCrest?.message}
            />
            <FormSelect
              label="Mastoid Size"
              id="mastoidSize"
              options={mastoidSizeOptions}
              {...register('mastoidSize', { required: 'Required' })}
              error={errors.mastoidSize?.message}
            />
            <FormSelect
              label="Cranial Suture"
              id="cranialSuture"
              options={cranialSutureOptions}
              {...register('cranialSuture', { required: 'Required' })}
              error={errors.cranialSuture?.message}
            />
          </div>

          <div className="mt-8 border-t border-dark-border/50 pt-8">
            <h3 className="text-white text-lg font-medium mb-4">Guide For Measurements</h3>
            <div className="bg-dark-main p-4 rounded-lg border border-dark-border flex items-center justify-center h-48 text-text-secondary">
              <p>Reference images and explanatory text would be displayed here to ensure user accuracy.</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="danger" onClick={() => navigate('/analysis/new')}>Back</Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
