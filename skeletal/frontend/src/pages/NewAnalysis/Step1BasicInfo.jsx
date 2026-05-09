import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Stepper from '../../components/common/Stepper';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';

export default function Step1BasicInfo() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    navigate('/analysis/new/step2');
  };

  const steps = [
    { label: 'Basic Information' },
    { label: 'Skeletal Measurements' },
    { label: 'Review & Predict' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <Stepper steps={steps} currentStep={1} />

      <div className="bg-dark-card rounded-2xl border border-dark-border/50 shadow-sm p-8 mt-8">
        <h2 className="text-white text-xl font-semibold mb-6">Enter Basic Information</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Case ID"
              id="caseId"
              placeholder="#0001"
              {...register('caseId', { required: 'Case ID is required' })}
              error={errors.caseId?.message}
            />
            <FormInput
              label="User Name"
              id="userName"
              placeholder="Chamudi Gayeshika"
              {...register('userName', { required: 'User Name is required' })}
              error={errors.userName?.message}
            />
            <FormInput
              label="Bones Type"
              id="bonesType"
              placeholder="Pelvis"
              {...register('bonesType', { required: 'Bones Type is required' })}
              error={errors.bonesType?.message}
            />
            <FormInput
              label="Location"
              id="location"
              placeholder="Kottawa"
              {...register('location', { required: 'Location is required' })}
              error={errors.location?.message}
            />
            <FormInput
              label="Date Found"
              id="dateFound"
              type="date"
              {...register('dateFound', { required: 'Date Found is required' })}
              error={errors.dateFound?.message}
            />
            <FormInput
              label="Analysis Date"
              id="analysisDate"
              type="date"
              {...register('analysisDate', { required: 'Analysis Date is required' })}
              error={errors.analysisDate?.message}
            />
            <div className="md:col-span-2">
              <FormInput
                label="Email"
                id="email"
                type="email"
                placeholder="chmudi@gmail.com"
                {...register('email')}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
