

import { groupByRelation } from "../../lib/filter";
import { GetProgramTracksDto } from "./types";


export function groupProgramTracksByDepartment(
  tracks: GetProgramTracksDto
) {
  return groupByRelation(tracks, (track) => track.department)
    .map((group) => ({
      department: group.relation,
      tracks: group.items,
    }));
}
