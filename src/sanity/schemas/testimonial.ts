import { defineType, defineField } from "sanity";

export default defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "localizedText",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "authorName",
      title: "Author Name/Title",
      type: "localizedString",
      description: "e.g., 'Director', '董事'",
    }),
    defineField({
      name: "authorRole",
      title: "Author Role/Company",
      type: "string",
      description: "e.g., 'C21NET'",
    }),
    defineField({
      name: "authorImage",
      title: "Author Image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "companyLogo",
      title: "Company Logo",
      type: "image",
    }),
  ],
  preview: {
    select: {
      quote: "quote.en",
      author: "authorRole",
      media: "authorImage",
    },
    prepare({ quote, author, media }) {
      return {
        title: quote ? `"${quote.substring(0, 50)}..."` : "No quote",
        subtitle: author || "Anonymous",
        media,
      };
    },
  },
});
