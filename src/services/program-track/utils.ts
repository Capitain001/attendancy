import { groupByRelation } from "../resources/utils";
import { ProgramTracksDto } from "./types";


export function groupProgramTracksByDepartment(
  tracks: ProgramTracksDto
) {
  return groupByRelation(tracks, (track) => track.department)
    .map((group) => ({
      department: group.relation,
      tracks: group.items,
    }));
}
