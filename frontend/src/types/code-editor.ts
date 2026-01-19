import { EditorLanguage } from '@/constants/code-editor';

export type CursorState = {
  lineNumber: number;
  column: number;
};

export type UserRole = 'viewer' | 'presenter';

export type UserState = {
  name: string;
  role: UserRole;
};

export type LanguageState = {
  value: EditorLanguage;
  updatedAt: number;
  updatedBy: number; // clientID
};

export type AwarenessState = {
  user?: UserState;
  cursor?: CursorState | null;
};
