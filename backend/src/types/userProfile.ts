export interface UserProfile {
  id: number;
  name: string;
  grade: string;
  lastSubject: string | null;
  lastChapter: string | null;
  userRole: string | null;
}
