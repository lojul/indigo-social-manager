import { defineType } from "sanity";

export default defineType({
  name: "localizedText",
  title: "Localized Text",
  type: "object",
  fields: [
    {
      name: "zhTW",
      title: "繁體中文",
      type: "text",
      rows: 3,
    },
    {
      name: "zhCN",
      title: "简体中文",
      type: "text",
      rows: 3,
    },
    {
      name: "en",
      title: "English",
      type: "text",
      rows: 3,
    },
  ],
  options: {
    collapsible: false,
  },
});
