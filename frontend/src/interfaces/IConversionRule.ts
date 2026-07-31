export interface IConversionRule {
  conversionRuleId: number;
  fromText: string;
  toText: string;
  fromTextNb: string | null;
  toTextNb: string | null;
  sortOrder: number;
}
