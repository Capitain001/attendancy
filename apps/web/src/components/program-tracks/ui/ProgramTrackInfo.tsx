"use server"
import { getProgramTrackAction } from '@/services/program-track/actions';
import { ProgramTrackActions } from './ProgramTrackActions';
import { ProgramTrackBanner } from './ProgramTrackBanner';

export default async function ProgramTrackInfo({programTrackId}:{programTrackId:string}) {
  const {data:programTrack, error} = await getProgramTrackAction({programTrackId});
  if (error || !programTrack) {
    return <div>Erreur: {error || 'Programme non trouvé'}</div>;
  }

  return (
    <div className="flex w-full">
    <ProgramTrackBanner programTrack={programTrack} />

    </div>
  )
}
