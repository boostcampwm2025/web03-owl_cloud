export const LANGUAGE_OPTIONS = [
  // Web
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'SCSS', value: 'scss' },
  { label: 'JSON', value: 'json' },

  // Backend
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'Go', value: 'go' },
  { label: 'PHP', value: 'php' },

  // System
  { label: 'C', value: 'c' },
  { label: 'C#', value: 'csharp' },
  { label: 'C++', value: 'cpp' },
  { label: 'Rust', value: 'rust' },

  // Script / Config
  { label: 'Shell', value: 'shell' },
  { label: 'YAML', value: 'yaml' },
  { label: 'SQL', value: 'sql' },
  { label: 'Dockerfile', value: 'dockerfile' },
  { label: 'GraphQL', value: 'graphql' },

  // etc
  { label: 'Markdown', value: 'markdown' },
] as const;

export type EditorLanguage = (typeof LANGUAGE_OPTIONS)[number]['value'];
