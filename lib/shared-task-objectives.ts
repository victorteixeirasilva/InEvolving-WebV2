import { getInviteByToken } from "@/lib/category-share-storage";
import type { Category, Objective, Tarefa } from "@/lib/types/models";

/** Objetivos permitidos para edição de uma tarefa colaborativa (mesma categoria de origem). */
export function getObjectivesForSharedCollaborativeTask(
  task: Tarefa,
  categories: Category[]
): Objective[] | null {
  if (!task.sharedTask) return null;
  const st = task.sharedTask;
  const owned = categories.find((c) => !c.sharedFrom && c.id === st.sourceCategoryId);
  if (owned) return owned.objectives;
  for (const c of categories) {
    if (!c.sharedFrom || !c.shareToken) continue;
    const inv = getInviteByToken(c.shareToken);
    if (inv && inv.categoryId === st.sourceCategoryId && inv.ownerEmail === st.ownerEmail) {
      return c.objectives;
    }
  }
  return null;
}
