export const COMPANY_SIZES = [
  { value: '1-10',     label: '1–10',     sublabel: 'Startup'    },
  { value: '11-50',    label: '11–50',    sublabel: 'Small'      },
  { value: '51-200',   label: '51–200',   sublabel: 'Growth'     },
  { value: '201-1000', label: '201–1000', sublabel: 'Mid-size'   },
  { value: '1000+',    label: '1000+',    sublabel: 'Enterprise' },
] as const;

export const COMPANY_CATEGORIES = [
  'Technology / SaaS',
  'E-commerce / Retail',
  'Healthcare',
  'Finance / Fintech',
  'Education / EdTech',
  'Marketing / Media',
  'Consulting / Services',
  'Food & Beverage',
  'Real Estate',
  'Manufacturing',
  'Non-profit / NGO',
] as const;

export const FACEBOOK_LANGUAGES = [
  { value: 'en',    label: 'English',             native: 'English'      },
  { value: 'zh-TW', label: 'Traditional Chinese', native: '繁體中文'     },
  { value: 'zh-CN', label: 'Simplified Chinese',  native: '简体中文'     },
  { value: 'yue',   label: 'Cantonese',           native: '粵語'         },
  { value: 'ms',    label: 'Malay',               native: 'Bahasa Melayu'},
  { value: 'ja',    label: 'Japanese',            native: '日本語'       },
  { value: 'ko',    label: 'Korean',              native: '한국어'       },
  { value: 'th',    label: 'Thai',               native: 'ภาษาไทย'      },
] as const;
