import { defineType, defineField } from "sanity";

export default defineType({
  name: "businessType",
  title: "Business Type",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "localizedString",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localizedString",
      description: "Short description (1-2 lines)",
    }),
    defineField({
      name: "icon",
      title: "Icon Name",
      type: "string",
      description: "Lucide icon name (e.g., ShoppingBag, Coffee, Dumbbell)",
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
      title: "name.en",
      icon: "icon",
    },
    prepare({ title, icon }) {
      return {
        title: title || "Untitled",
        subtitle: icon ? `Icon: ${icon}` : "No icon",
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
