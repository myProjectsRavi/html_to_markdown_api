import { Parser } from "htmlparser2";
import {
  PARSER_LIMITS,
  ParserBudget,
  ParserLimitError,
  type ParserLimits,
} from "./limits";

export interface ParsedRoot {
  readonly kind: "root";
  readonly children: ParsedNode[];
}

export interface ParsedElement {
  readonly kind: "element";
  readonly name: string;
  readonly attributes: ReadonlyArray<readonly [string, string]>;
  readonly children: ParsedNode[];
  readonly implied: boolean;
}

export interface ParsedText {
  readonly kind: "text";
  readonly value: string;
}

export interface ParsedComment {
  readonly kind: "comment";
  readonly value: string;
}

export interface ParsedInstruction {
  readonly kind: "instruction";
  readonly name: string;
  readonly data: string;
}

export type ParsedNode =
  | ParsedElement
  | ParsedText
  | ParsedComment
  | ParsedInstruction;

export class ParserInternalError extends Error {
  readonly code = "internal_error" as const;

  constructor(readonly cause: unknown) {
    super("HTML parser failed.");
    this.name = "ParserInternalError";
  }
}

export interface ParseHtmlOptions {
  readonly limits?: ParserLimits;
  readonly skipElements?: ReadonlySet<string>;
  readonly onLimit?: (error: ParserLimitError) => void;
}

interface Frame {
  readonly node: ParsedElement | null;
  readonly skipping: boolean;
}

const EMPTY_SKIP_SET: ReadonlySet<string> = new Set();

function append(
  root: ParsedRoot,
  frames: readonly Frame[],
  node: ParsedNode,
): void {
  const parent = frames.at(-1);
  if (parent?.node) {
    parent.node.children.push(node);
  } else {
    root.children.push(node);
  }
}

export function parseHtml(
  html: string,
  options: ParseHtmlOptions = {},
): ParsedRoot {
  const budget = new ParserBudget(options.limits ?? PARSER_LIMITS);
  const skipElements = options.skipElements ?? EMPTY_SKIP_SET;
  const root: ParsedRoot = { kind: "root", children: [] };
  const frames: Frame[] = [];
  let pendingAttributes: Array<readonly [string, string]> = [];

  try {
    const parser = new Parser(
      {
        onopentagname() {
          budget.event();
          budget.beginElement();
          pendingAttributes = [];
        },
        onattribute(name, value) {
          budget.event();
          budget.attribute(name, value);
          pendingAttributes.push([name, value]);
        },
        onopentag(name, _attributes, implied) {
          const parentSkipping = frames.at(-1)?.skipping ?? false;
          const skipping = parentSkipping || skipElements.has(name);
          let node: ParsedElement | null = null;

          if (!skipping) {
            budget.retainNode();
            node = {
              kind: "element",
              name,
              attributes: pendingAttributes,
              children: [],
              implied,
            };
            append(root, frames, node);
          }

          frames.push({ node, skipping });
          pendingAttributes = [];
        },
        ontext(value) {
          if (value.length === 0) return;
          budget.event();
          if (frames.at(-1)?.skipping) return;
          budget.retainNode();
          append(root, frames, { kind: "text", value });
        },
        oncomment(value) {
          budget.event();
          if (frames.at(-1)?.skipping) return;
          budget.retainNode();
          append(root, frames, { kind: "comment", value });
        },
        onprocessinginstruction(name, data) {
          budget.event();
          if (frames.at(-1)?.skipping) return;
          budget.retainNode();
          append(root, frames, {
            kind: "instruction",
            name,
            data,
          });
        },
        oncdatastart() {
          budget.event();
        },
        oncdataend() {
          budget.event();
        },
        onclosetag() {
          budget.event();
          budget.endElement();
          frames.pop();
        },
      },
      {
        decodeEntities: true,
        lowerCaseTags: true,
        lowerCaseAttributeNames: true,
      },
    );

    parser.end(html);
    return root;
  } catch (error) {
    if (error instanceof ParserLimitError) {
      options.onLimit?.(error);
      throw error;
    }
    throw new ParserInternalError(error);
  }
}
