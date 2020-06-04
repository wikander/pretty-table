export interface PrettyTableConfig {
  output?: Deno.Writer & Deno.WriterSync & Deno.Closer;
  spacing?: number;
  padding?: number;
  border?: boolean;
  innerBorder?: boolean;
}
