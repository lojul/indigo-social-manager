import { defineType, defineField } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Site Title",
      type: "string",
      initialValue: "Site Settings",
      hidden: true,
    }),
    // Brand
    defineField({
      name: "brandName",
      title: "Brand Name",
      type: "string",
      initialValue: "Indigo Foundry",
    }),
    defineField({
      name: "brandNameChinese",
      title: "Brand Name (Chinese)",
      type: "string",
      initialValue: "青藍科技",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "localizedString",
    }),

    // Contact
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp Number",
      type: "string",
      description: "Full number with country code, e.g., 85294576354",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook URL",
      type: "url",
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn URL",
      type: "url",
    }),

    // SEO Defaults
    defineField({
      name: "defaultMetaTitle",
      title: "Default Meta Title",
      type: "localizedString",
    }),
    defineField({
      name: "defaultMetaDescription",
      title: "Default Meta Description",
      type: "localizedText",
    }),

    // Pricing Page Note
    defineField({
      name: "subscriptionNote",
      title: "Subscription Note",
      type: "localizedString",
      description: "Note about Odoo subscription pricing",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Site Settings",
      };
    },
  },
});
