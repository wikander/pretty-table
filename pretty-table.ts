export default class PrettyTable {
  private output: Deno.Writer & Deno.WriterSync & Deno.Closer;
  private padding: number;
  private spacing: number;
  constructor(conf: PrettyTableConfig) {
    this.output = conf?.output ?? Deno.stdout;
    this.padding = conf?.padding ?? 0;
    this.spacing = conf?.spacing ?? 1;
  }

  private async writeCol(
    content: string,
    contentWidth?: number,
    padRight?: number,
    padLeft?: number
  ): Promise<void> {
    content = content?.trim() ?? "";

    if (contentWidth) {
      content = content.padEnd(contentWidth);
    }

    if (padRight) {
      content = `${content}${" ".repeat(padRight)}`;
    }

    if (padLeft) {
      content = `${" ".repeat(padLeft)}${content}`;
    }

    await this.writeText(content);
  }

  async writeText(text: string): Promise<void> {
    await this.output.write(new TextEncoder().encode(text));
  }

  async write(table: any[][]): Promise<void> {
    if (table.some((row) => row.length !== table[0].length)) {
      throw new RangeError("All rows must have equal length.");
    }
    const widths: number[] = [];

    for (let row of table) {
      for (let [index, col] of row.entries()) {
        row[index] = (col ?? "") + "";
        const colLength = row[index]?.length ?? 0;
        if (!widths[index] || widths[index] < colLength) {
          widths[index] = colLength;
        }
      }
    }

    for (let [i, row] of table.entries()) {
      if (i !== 0) {
        await this.writeText("\n");
      }
      await this.writeText(`${" ".repeat(this.padding)}`);

      for (let [j, col] of row.entries()) {
        if (typeof col !== "string") {
          throw new Error("no string");
        }

        if (j === 0) {
          await this.writeCol(col, widths[j]);
        } else {
          await this.writeCol(col, widths[j], 0, this.spacing);
        }
      }

      await this.writeText(`${" ".repeat(this.padding)}`);
    }
  }
}

// https://www.compart.com/en/unicode/block/U+2500
// ┏━┳┓
// ┃━━┃
// ┣━╋┫
// ┗━┻┛

const enum Border {
  Horizontal = "━",
  HorizontalDown = "┳",
  HorizontalUp = "┻",
  Vertical = "┃",
  VerticalRight = "┣",
  VerticalLeft = "┫",
  TopLeft = "┏",
  TopRight = "┓",
  BottomLeft = "┗",
  BottomRight = "┛",
}
export const enum Test {
  test,
  test1,
}

export interface PrettyTableConfig {
  output?: Deno.Writer & Deno.WriterSync & Deno.Closer;
  spacing?: number;
  padding?: number;
}
