export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string | null;
  grade: string | null;
  createdAt: string;
}
