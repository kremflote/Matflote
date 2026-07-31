import type { IConversionRule } from "../interfaces/IConversionRule";
import { apiRequest } from "./apiClient";

export type ConversionRuleRequest = {
  fromText: string;
  toText: string;
};

export const conversionRuleService = {
  getAll: () => apiRequest<IConversionRule[]>("/api/conversion-rules"),
  create: (rule: ConversionRuleRequest) =>
    apiRequest<IConversionRule>("/api/conversion-rules", {
      method: "POST",
      body: rule,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/conversion-rules/${id}`, {
      method: "DELETE",
    }),
};
