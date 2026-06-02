import { defineType } from "sanity";

export default defineType({
  name: "stat",
  title: "Statistic",
  type: "object",
  fields: [
    {
      name: "value",
      title: "Value",
      type: "string",
      description: "e.g., 98%, 3x, 70%",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "label",
      title: "Label",
      type: "localizedString",
      description: "Short label for the stat",
    },
    {
      name: "description",
      title: "Description",
      type: "localizedText",
      description: "Longer description explaining the stat",
    },
  ],
  preview: {
    select: {
      value: "value",
      label: "label.en",
    },
    prepare({ value, label }) {
      return {
        title: value || "No value",
        subtitle: label || "No label",
      };
    },
  },
});
