import { PrettyTableConfig } from "./model/pretty-table-config.ts";
import { Border } from "./model/border.ts";
import { OrderWhich } from "./model/order-which.ts";

interface PrettyTableConfigWithDefaults {
  output: Deno.Writer & Deno.WriterSync & Deno.Closer;
  spacing: number;
  padding: number;
  border: boolean;
  innerBorder: boolean;
}

type RawTable = any[][];
type Table = string[][];
type Row = string[];

export default class PrettyTable {
  private readonly conf: PrettyTableConfigWithDefaults;

  constructor(conf: PrettyTableConfig = {}) {
    this.conf = Object.assign({}, conf) as PrettyTableConfigWithDefaults;
    this.conf.output = conf.output ?? Deno.stdout;
    this.conf.spacing = conf.spacing ?? 1;

    if (conf.border === true) {
      this.conf.padding = conf.padding ?? 1;
    } else {
      this.conf.padding = conf.padding ?? 0;
    }

    this.conf.border = conf.border ?? false;
    this.conf.innerBorder = conf.innerBorder ?? true;
  }

  public async write(rawTable: RawTable): Promise<void> {
    const table = this.stringifyTable(rawTable);
    const widths: number[] = this.calculateColWidths(table);

    for (let [i, row] of table.entries()) {
      if (this.whichInOrder(i, table) !== OrderWhich.First) {
        await this.newLine();
      }

      if (this.conf.border) {
        if (this.whichInOrder(i, table) === OrderWhich.First) {
          await this.writeBorderRow(widths, OrderWhich.First);
        } else if (this.conf.innerBorder) {
          await this.writeBorderRow(widths, OrderWhich.Intermediate);
        }
      }

      for (let [j, col] of row.entries()) {
        if (typeof col !== "string") {
          throw new Error("no string");
        }

        if (this.whichInOrder(j, widths) === OrderWhich.First) {
          await this.writeCol(
            col,
            widths[j],
            this.conf.border ? this.conf.padding : 0,
            this.conf.padding,
            " ",
            Border.Vertical,
            this.conf.innerBorder ? Border.Vertical : undefined
          );
        } else if (this.whichInOrder(j, widths) === OrderWhich.Intermediate) {
          await this.writeCol(
            col,
            widths[j],
            this.conf.border ? this.conf.padding : 0,
            this.conf.border ? this.conf.padding : this.conf.spacing,
            " ",
            undefined,
            this.conf.innerBorder ? Border.Vertical : undefined
          );
        } else {
          await this.writeCol(
            col,
            widths[j],
            this.conf.padding,
            this.conf.border ? this.conf.padding : this.conf.spacing,
            " ",
            undefined,
            Border.Vertical
          );
        }
      }

      if (this.conf.border) {
        if (this.whichInOrder(i, table) === OrderWhich.Last) {
          await this.writeText(`\n`);
          await this.writeBorderRow(widths, OrderWhich.Last);
        }
      }
    }
  }

  private async writeBorderRow(
    contentWidths: number[],
    rowWhich: OrderWhich
  ): Promise<void> {
    const numberOfCols = contentWidths.length;
    let betweenString: string = this.conf.innerBorder
      ? Border.HorizontalDown
      : "";
    let padString: string = Border.Horizontal;

    let beforeString: string = Border.VerticalRight;
    let afterString: string = Border.VerticalLeft;

    if (rowWhich === OrderWhich.First) {
      beforeString = Border.TopRight;
      afterString = Border.TopLeft;
    } else if (rowWhich === OrderWhich.Intermediate) {
      beforeString = Border.VerticalRight;
      afterString = Border.VerticalLeft;

      betweenString = Border.Cross;
    } else if (rowWhich === OrderWhich.Last) {
      betweenString = this.conf.innerBorder ? Border.HorizontalUp : "";
      beforeString = Border.BottomRight;
      afterString = Border.BottomLeft;
    }

    for (let i = 0; i < numberOfCols; i++) {
      if (this.whichInOrder(i, contentWidths) === OrderWhich.First) {
        await this.writeCol(
          "",
          contentWidths[i],
          this.conf.padding,
          this.conf.padding,
          padString,
          beforeString
        );
      } else if (
        this.whichInOrder(i, contentWidths) === OrderWhich.Intermediate
      ) {
        await this.writeCol(
          "",
          contentWidths[i],
          this.conf.padding,
          this.conf.padding,
          padString,
          betweenString
        );
      } else {
        await this.writeCol(
          "",
          contentWidths[i],
          this.conf.padding,
          this.conf.padding,
          padString,
          betweenString,
          afterString
        );
      }
    }

    await this.newLine();
  }

  private async writeCol(
    content: string,
    contentWidth?: number,
    padRight?: number,
    padLeft?: number,
    padString: string = " ",
    beforeString: string | undefined = undefined,
    afterString: string | undefined = undefined
  ): Promise<void> {
    if (contentWidth) {
      content = content.padEnd(contentWidth, padString);
    }

    if (padRight) {
      content = `${content}${padString.repeat(padRight)}`;
    }

    if (padLeft) {
      content = `${padString.repeat(padLeft)}${content}`;
    }

    if (this.conf.border) {
      content = `${beforeString ? beforeString : ""}${content}${
        afterString ? afterString : ""
      }`;
    }

    await this.writeText(content);
  }

  private async writeText(text: string): Promise<void> {
    await this.conf.output.write(new TextEncoder().encode(text));
  }

  private async newLine(): Promise<void> {
    await this.writeText("\n");
  }

  private calculateColWidths(table: Table): number[] {
    const tableWidth = table[0].length;
    return table.reduce((acc: number[], row: Row) => {
      for (let i = 0; i < tableWidth; i++) {
        acc[i] = Math.max(acc[i], row[i].length);
      }
      return acc;
    }, Array(tableWidth).fill(0));
  }

  private stringifyTable(table: RawTable): Table {
    const tableWidth = table.map((row) => row.length).sort((a, b) => b - a)[0]; // Sort descending, take first.
    return table.map((row: any[]) => {
      const newRow: string[] = [];
      for (let i = 0; i < tableWidth; i++) {
        newRow[i] = ((row[i] ?? "") + "").trim();
      }
      return newRow;
    });
  }

  private whichInOrder(i: number, total: number | any[]): OrderWhich {
    if (i === 0) {
      return OrderWhich.First;
    }

    let max = null;
    if (typeof total === "number") {
      max = total;
    } else {
      max = total.length - 1;
    }

    if (i < max) {
      return OrderWhich.Intermediate;
    } else {
      return OrderWhich.Last;
    }
  }
}
