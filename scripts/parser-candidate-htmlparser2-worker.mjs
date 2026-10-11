import { Parser } from "htmlparser2";

export default {
  fetch() {
    let events = 0;
    const parser = new Parser({
      onopentag() { events += 1; },
      ontext() { events += 1; },
      onclosetag() { events += 1; },
    });
    parser.end("<p>A&amp;B</p>");
    return Response.json({ events });
  },
};
