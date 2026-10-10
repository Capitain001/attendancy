export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "DIRECTION" | "GUEST";
export type OrganizationType = "INSTITUTION" | "PERSONAL";

export interface OrganizationSummary {
  id?: string;
  name?: string;
  slug?: string;
  type?: OrganizationType;
  logo?: string;
  permissions?: string[];
}

export interface UserInfo {
  id?: string;
  email?: string;
  name?: string;
  role?: Role;
  organization?: OrganizationSummary;
}
