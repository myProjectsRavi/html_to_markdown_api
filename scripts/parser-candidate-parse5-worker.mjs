import { parse } from "parse5";

export default {
  fetch() {
    const document = parse("<p>A&amp;B</p>");
    return Response.json({ root: document.nodeName });
  },
};
