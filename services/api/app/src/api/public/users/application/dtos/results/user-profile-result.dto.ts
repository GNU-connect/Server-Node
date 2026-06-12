export interface UserProfileCampusResult {
  id: number;
  name: string;
}

export interface UserProfileCollegeResult {
  id: number;
  name: string;
}

export interface UserProfileDepartmentResult {
  id: number;
  name: string;
}

export interface UserProfileResult {
  userId: string;
  campus: UserProfileCampusResult | null;
  college: UserProfileCollegeResult | null;
  department: UserProfileDepartmentResult | null;
}
