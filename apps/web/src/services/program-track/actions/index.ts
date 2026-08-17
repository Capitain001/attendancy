export * from './programTrack.queries';
export * from './programTrack.mutations';

export async function addProgramTrackAction(data: Parameters<typeof import('./programTrack.mutations').createProgramTrackAction>[0]) {
  return (await import('./programTrack.mutations')).createProgramTrackAction(data);
}

export async function removeProgramTrackAction(programTrackId: string) {
  return (await import('./programTrack.mutations')).deleteProgramTrackAction(programTrackId);
}
