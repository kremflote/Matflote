import type { IAssistantUndoResult, IAssistantWriteLogEntry } from "../interfaces/IAssistant";
import { API_BASE_URL, apiRequest, sendRequest, toApiError } from "./apiClient";

export const assistantService = {
  getLog: (limit = 10) => apiRequest<IAssistantWriteLogEntry[]>(`/api/assistant/log?limit=${limit}`),
  /**
   * Undoes the newest meal plan write by the assistant. A 409 (the slots were changed since) is an answer,
   * not a failure: it comes back with `applied: false` and the reason in `errors`.
   */
  undoMealPlan: async (force: boolean): Promise<IAssistantUndoResult> => {
    const response = await sendRequest(`${API_BASE_URL}/api/assistant/meal-plan/undo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });

    if (!response.ok && response.status !== 409) {
      throw await toApiError(response);
    }

    return (await response.json()) as IAssistantUndoResult;
  },
};
