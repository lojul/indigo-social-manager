import { defineType, defineField } from "sanity";

export default defineType({
  name: "caseStudy",
  title: "Case Study",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "meta", title: "SEO & Meta" },
    { name: "media", title: "Media" },
  ],
  fields: [
    // Basic Info
    defineField({
      name: "title",
      title: "Title",
      type: "localizedString",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "localizedString",
      group: "content",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: {
        source: "title.en",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "localizedText",
      group: "content",
      description: "Brief overview shown in hero section",
    }),

    // Client Info (At a Glance)
    defineField({
      name: "client",
      title: "Client Name",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "clientLogo",
      title: "Client Logo",
      type: "image",
      group: "media",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "industry",
      title: "Industry",
      type: "localizedString",
      group: "content",
    }),
    defineField({
      name: "duration",
      title: "Duration / Time to Results",
      type: "localizedString",
      group: "content",
      description: "e.g., '6 weeks'",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      group: "content",
      options: {
        layout: "tags",
      },
    }),

    // Stats Section
    defineField({
      name: "stats",
      title: "Key Statistics",
      type: "array",
      of: [{ type: "stat" }],
      group: "content",
      description: "Key metrics (e.g., 98% faster, 70% cost reduction)",
      validation: (Rule) => Rule.max(4),
    }),

    // Bottleneck / Problem Section
    defineField({
      name: "bottleneckTitle",
      title: "Bottleneck Section Title",
      type: "localizedString",
      group: "content",
    }),
    defineField({
      name: "bottleneckDescription",
      title: "Bottleneck Description",
      type: "localizedText",
      group: "content",
    }),
    defineField({
      name: "bottlenecks",
      title: "Bottleneck Items",
      type: "array",
      of: [{ type: "feature" }],
      group: "content",
      description: "Problems the client faced before",
    }),

    // Solution / Pivot Section
    defineField({
      name: "solutionTitle",
      title: "Solution Section Title",
      type: "localizedString",
      group: "content",
    }),
    defineField({
      name: "solutionDescription",
      title: "Solution Description",
      type: "localizedText",
      group: "content",
    }),
    defineField({
      name: "solutions",
      title: "Solution Items",
      type: "array",
      of: [{ type: "feature" }],
      group: "content",
      description: "How we solved the problems",
    }),

    // Testimonial
    defineField({
      name: "testimonial",
      title: "Testimonial",
      type: "reference",
      to: [{ type: "testimonial" }],
      group: "content",
    }),

    // SEO
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "localizedString",
      group: "meta",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "localizedText",
      group: "meta",
    }),

    // Publishing
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      group: "meta",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "meta",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "title.en",
      client: "client",
      media: "clientLogo",
    },
    prepare({ title, client, media }) {
      return {
        title: title || "Untitled",
        subtitle: client || "No client",
        media,
      };
    },
  },
  orderings: [
    {
      title: "Published Date, New",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});
