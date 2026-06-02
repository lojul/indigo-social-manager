import { defineType } from "sanity";

export default defineType({
  name: "localizedString",
  title: "Localized String",
  type: "object",
  fields: [
    {
      name: "zhTW",
      title: "繁體中文",
      type: "string",
    },
    {
      name: "zhCN",
      title: "简体中文",
      type: "string",
    },
    {
      name: "en",
      title: "English",
      type: "string",
    },
  ],
  options: {
    collapsible: false,
  },
});
