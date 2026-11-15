import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/Primitives'
import { VehicleForm } from '@/components/vehicle/VehicleForm'
import { useVehicles } from '@/context/VehiclesContext'

export function VehicleNewPage() {
  const navigate = useNavigate()
  const { addVehicle } = useVehicles()

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Vehicle onboarding"
        title="Add your vehicle"
        description="Enter the details you know. Anything you leave blank is flagged as an assumption rather than a fact."
      />

      <VehicleForm
        submitLabel="Create vehicle profile"
        onCancel={() => navigate('/vehicles')}
        onSubmit={async (values) => {
          const vehicle = await addVehicle(values)
          navigate(`/vehicles/${vehicle.id}`, { replace: true })
        }}
      />
    </div>
  )
}
