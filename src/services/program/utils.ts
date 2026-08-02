import { groupByRelation } from "../resources/utils";
import { ProgramListDto } from "./types";

export function groupProgramsByTrack(
  programs: ProgramListDto
) {
  return groupByRelation(programs, (p) => p.programTrack)
    .map((group) => ({
      programTrack: group.relation,
      programs: group.items,
    }));
}



// export function groupProgramsByTrack(
//   programs: ProgramListDto
// ): ProgramByTrack[] {
//   const map = new Map<string, ProgramByTrack>();

//   for (const program of programs) {
//     const trackId = program.programTrack.id;

//     if (!map.has(trackId)) {
//       map.set(trackId, {
//         programTrack: program.programTrack,
//         programs: [],
//       });
//     }

//     map.get(trackId)!.programs.push(program);
//   }

//   return Array.from(map.values());
// }
