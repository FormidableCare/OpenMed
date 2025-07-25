import { MedicationList } from '@/components/MedicationList';
import { CacheWarmer } from '@/components/CacheWarmer';

export default function MedicationsPage() {
  return (
    <>
      <MedicationList />
      <CacheWarmer />
    </>
  );
}
