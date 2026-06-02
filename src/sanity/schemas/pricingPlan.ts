import { defineType, defineField } from "sanity";

export default defineType({
  name: "pricingPlan",
  title: "Pricing Plan",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Plan Title",
      type: "localizedString",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "localizedText",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title.en",
        maxLength: 50,
      },
    }),
    defineField({
      name: "icon",
      title: "Icon Name",
      type: "string",
      description: "Lucide icon name (e.g., Zap, Rocket, Building2)",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "localizedString",
      description: "e.g., 'HK$3,000' or 'Custom'",
    }),
    defineField({
      name: "originalPrice",
      title: "Original Price (if discounted)",
      type: "string",
      description: "e.g., 'HK$5,000' - shown with strikethrough",
    }),
    defineField({
      name: "priceNote",
      title: "Price Note",
      type: "localizedString",
      description: "e.g., '起' (from), '/month'",
    }),
    defineField({
      name: "badge",
      title: "Badge Text",
      type: "localizedString",
      description: "e.g., 'Limited Time', 'Most Popular'",
    }),
    defineField({
      name: "popular",
      title: "Is Popular/Highlighted",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "text", type: "localizedString", title: "Feature Text" },
            { name: "included", type: "boolean", title: "Included", initialValue: true },
          ],
          preview: {
            select: {
              title: "text.en",
              included: "included",
            },
            prepare({ title, included }) {
              return {
                title: title || "No text",
                subtitle: included ? "Included" : "Not included",
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "ctaText",
      title: "CTA Button Text",
      type: "localizedString",
    }),
    defineField({
      name: "ctaLink",
      title: "CTA Link",
      type: "string",
      description: "e.g., '/enquiry'",
    }),
    defineField({
      name: "disabled",
      title: "Disabled (Coming Soon)",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: "title.en",
      price: "price.en",
      popular: "popular",
    },
    prepare({ title, price, popular }) {
      return {
        title: title || "Untitled Plan",
        subtitle: `${price || "No price"}${popular ? " ⭐ Popular" : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
