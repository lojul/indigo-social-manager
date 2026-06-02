export const THEMES = {
  indigo: { bg: '#4F46E5', text: '#FFFFFF', accent: '#F59E0B', name: 'Indigo' },
  navy:   { bg: '#1E1B4B', text: '#FFFFFF', accent: '#818CF8', name: 'Navy' },
  teal:   { bg: '#0F766E', text: '#FFFFFF', accent: '#F59E0B', name: 'Teal' },
  slate:  { bg: '#1E293B', text: '#FFFFFF', accent: '#14B8A6', name: 'Slate' },
  rose:   { bg: '#BE123C', text: '#FFFFFF', accent: '#FDE047', name: 'Rose' },
  amber:  { bg: '#B45309', text: '#FFFFFF', accent: '#34D399', name: 'Amber' },
} as const;

export type ThemeKey = keyof typeof THEMES;
