import { defineType } from "sanity";

export default defineType({
  name: "localizedRichText",
  title: "Localized Rich Text",
  type: "object",
  fields: [
    {
      name: "zhTW",
      title: "繁體中文",
      type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "zhCN",
      title: "简体中文",
      type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "en",
      title: "English",
      type: "array",
      of: [{ type: "block" }],
    },
  ],
  options: {
    collapsible: true,
  },
});
