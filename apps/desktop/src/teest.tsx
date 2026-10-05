import type { ApiOutput } from '@attendancy/types'
type T = ApiOutput<'getClassesAction'>

/* 
result :
type T = {
 error: string;
 data?: undefined;
} | {
 data: {
 name: string;
 id: string;
 academicYearId: string;
 programTrackId: string;
 level: Level;
 academicYear: {
 name: string;
 id: string;
 };
 programTrack: {
 name: string;
 id: string;
 };
 _count: {
 courses: number;
 studentEnrollments: number;
 };
 }[];
 error?: undefined;
}
*/