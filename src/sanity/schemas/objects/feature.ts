import { defineType } from "sanity";

export default defineType({
  name: "feature",
  title: "Feature",
  type: "object",
  fields: [
    {
      name: "icon",
      title: "Icon Name",
      type: "string",
      description: "Lucide icon name (e.g., Languages, Zap, Users)",
    },
    {
      name: "title",
      title: "Title",
      type: "localizedString",
    },
    {
      name: "description",
      title: "Description",
      type: "localizedText",
    },
  ],
  preview: {
    select: {
      title: "title.en",
      icon: "icon",
    },
    prepare({ title, icon }) {
      return {
        title: title || "No title",
        subtitle: icon ? `Icon: ${icon}` : "No icon",
      };
    },
  },
});
