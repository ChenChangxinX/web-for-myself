import { diff_match_patch, DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT } from "diff-match-patch";

export type CompareMode = "line" | "char";

export interface CompareOptions {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
}

export interface DiffChunk {
  type: -1 | 0 | 1;
  text: string;
}

export interface LineDiffRow {
  type: "equal" | "add" | "delete" | "change";
  leftNumber?: number;
  rightNumber?: number;
  leftText?: string;
  rightText?: string;
  leftDiff?: DiffChunk[];
  rightDiff?: DiffChunk[];
}

export interface CompareResult {
  leftSummary: { lines: number; characters: number };
  rightSummary: { lines: number; characters: number };
  lineRows: LineDiffRow[];
  charLeftChunks: DiffChunk[];
  charRightChunks: DiffChunk[];
}

const dmp = new diff_match_patch();

function normalizeCase(text: string, ignoreCase: boolean) {
  return ignoreCase ? text.toLowerCase() : text;
}

function normalizeWhitespace(text: string, ignoreWhitespace: boolean) {
  if (!ignoreWhitespace) {
    return text;
  }

  return text.replace(/\s+/g, " ").trim();
}

function normalizeLine(text: string, options: CompareOptions) {
  return normalizeWhitespace(normalizeCase(text, options.ignoreCase), options.ignoreWhitespace);
}

function normalizeText(text: string, options: CompareOptions) {
  return normalizeWhitespace(normalizeCase(text, options.ignoreCase), options.ignoreWhitespace);
}

function splitLines(text: string) {
  return text.length ? text.split(/\r?\n/) : [];
}

function buildLcsTable(left: string[], right: string[]) {
  const table = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  return table;
}

function computeLineRows(leftText: string, rightText: string, options: CompareOptions) {
  const leftLinesRaw = splitLines(leftText);
  const rightLinesRaw = splitLines(rightText);
  const leftLines = leftLinesRaw.map((line) => normalizeLine(line, options));
  const rightLines = rightLinesRaw.map((line) => normalizeLine(line, options));
  const table = buildLcsTable(leftLines, rightLines);

  const rows: LineDiffRow[] = [];
  let i = 0;
  let j = 0;
  let leftNumber = 1;
  let rightNumber = 1;

  while (i < leftLines.length && j < rightLines.length) {
    if (leftLines[i] === rightLines[j]) {
      rows.push({
        type: "equal",
        leftNumber,
        rightNumber,
        leftText: leftLinesRaw[i],
        rightText: rightLinesRaw[j],
      });
      i += 1;
      j += 1;
      leftNumber += 1;
      rightNumber += 1;
      continue;
    }

    if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({
        type: "delete",
        leftNumber,
        leftText: leftLinesRaw[i],
      });
      i += 1;
      leftNumber += 1;
      continue;
    }

    rows.push({
      type: "add",
      rightNumber,
      rightText: rightLinesRaw[j],
    });
    j += 1;
    rightNumber += 1;
  }

  while (i < leftLines.length) {
    rows.push({
      type: "delete",
      leftNumber,
      leftText: leftLinesRaw[i],
    });
    i += 1;
    leftNumber += 1;
  }

  while (j < rightLines.length) {
    rows.push({
      type: "add",
      rightNumber,
      rightText: rightLinesRaw[j],
    });
    j += 1;
    rightNumber += 1;
  }

  const mergedRows: LineDiffRow[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const currentRow = rows[index];
    const nextRow = rows[index + 1];

    if (currentRow.type === "delete" && nextRow?.type === "add") {
      const leftValue = normalizeLine(currentRow.leftText ?? "", options);
      const rightValue = normalizeLine(nextRow.rightText ?? "", options);
      const leftDiff = chunkToDiffs(dmp.diff_main(leftValue, rightValue), true);
      const rightDiff = chunkToDiffs(dmp.diff_main(leftValue, rightValue), false);

      mergedRows.push({
        type: "change",
        leftNumber: currentRow.leftNumber,
        rightNumber: nextRow.rightNumber,
        leftText: leftValue,
        rightText: rightValue,
        leftDiff,
        rightDiff,
      });
      index += 1;
      continue;
    }

    if (currentRow.type === "delete" && currentRow.leftText != null) {
      mergedRows.push({
        ...currentRow,
        leftText: normalizeLine(currentRow.leftText, options),
      });
      continue;
    }

    if (currentRow.type === "add" && currentRow.rightText != null) {
      mergedRows.push({
        ...currentRow,
        rightText: normalizeLine(currentRow.rightText, options),
      });
      continue;
    }

    if (currentRow.type === "equal") {
      mergedRows.push({
        ...currentRow,
        leftText: normalizeLine(currentRow.leftText ?? "", options),
        rightText: normalizeLine(currentRow.rightText ?? "", options),
      });
    }
  }

  return mergedRows;
}

function chunkToDiffs(chunks: Array<[number, string]>, forLeft: boolean): DiffChunk[] {
  const diffs: DiffChunk[] = [];

  for (const [type, text] of chunks) {
    if (type === DIFF_EQUAL) {
      diffs.push({ type: 0, text });
      continue;
    }

    if (forLeft && type === DIFF_DELETE) {
      diffs.push({ type: -1, text });
      continue;
    }

    if (!forLeft && type === DIFF_INSERT) {
      diffs.push({ type: 1, text });
    }
  }

  return diffs;
}

function computeCharChunks(leftText: string, rightText: string, options: CompareOptions) {
  const leftNormalized = normalizeText(leftText, options);
  const rightNormalized = normalizeText(rightText, options);
  const diff = dmp.diff_main(leftNormalized, rightNormalized);
  dmp.diff_cleanupSemantic(diff);

  return {
    charLeftChunks: chunkToDiffs(diff, true),
    charRightChunks: chunkToDiffs(diff, false),
  };
}

export function compareTexts(leftText: string, rightText: string, options: CompareOptions): CompareResult {
  const lineRows = computeLineRows(leftText, rightText, options);
  const { charLeftChunks, charRightChunks } = computeCharChunks(leftText, rightText, options);

  return {
    leftSummary: { lines: splitLines(leftText).length, characters: leftText.length },
    rightSummary: { lines: splitLines(rightText).length, characters: rightText.length },
    lineRows,
    charLeftChunks,
    charRightChunks,
  };
}
