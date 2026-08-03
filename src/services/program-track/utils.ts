

import { groupByRelation } from "../../lib/filter";
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
