// Document types
import caseStudy from "./caseStudy";
import pricingPlan from "./pricingPlan";
import faq from "./faq";
import businessType from "./businessType";
import testimonial from "./testimonial";
import siteSettings from "./siteSettings";
import post from "./post";

// Object types (reusable)
import localizedString from "./objects/localizedString";
import localizedText from "./objects/localizedText";
import localizedRichText from "./objects/localizedRichText";
import stat from "./objects/stat";
import feature from "./objects/feature";

export const schemaTypes = [
  // Documents
  post,
  caseStudy,
  pricingPlan,
  faq,
  businessType,
  testimonial,
  siteSettings,
  // Objects
  localizedString,
  localizedText,
  localizedRichText,
  stat,
  feature,
];
