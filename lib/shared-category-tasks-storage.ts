import { listActiveSharesForCategory, viewerHasCollaborativeAccessToCategory } from "@/lib/category-share-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import type { Tarefa } from "@/lib/types/models";

const ID_MIN = 881_000;

function notifySharedTasksChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("inevolving:shared-tasks-changed"));
  }
}

function loadRaw(): Tarefa[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sharedCategoryTasks);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x) => x && typeof x === "object") as Tarefa[];
  } catch {
    return [];
  }
}

function saveRaw(list: Tarefa[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.sharedCategoryTasks, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function nextId(list: Tarefa[]): number {
  const nums = list
    .map((t) => t.id)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : ID_MIN - 1;
  return Math.max(ID_MIN, max + 1);
}

export type SharedTaskCollaborationMeta = {
  sourceCategoryId: string;
  ownerEmail: string;
  createdByEmail: string;
  createdByName?: string;
};

export function loadCollaborativeTasksForViewer(viewerEmail: string): Tarefa[] {
  const v = viewerEmail.trim().toLowerCase();
  if (!v) return [];
  return loadRaw().filter((t) => {
    const st = t.sharedTask;
    if (!st) return false;
    return viewerHasCollaborativeAccessToCategory(v, st.sourceCategoryId, st.ownerEmail);
  });
}

export function addCollaborativeTask(params: {
  task: Omit<Tarefa, "id" | "uuid" | "sharedTask">;
  collaboration: SharedTaskCollaborationMeta;
}): Tarefa {
  const list = loadRaw();
  const id = nextId(list);
  const uuid = `collab-${id}-${Date.now().toString(36)}`;
  const task: Tarefa = {
    ...params.task,
    id,
    uuid,
    sharedTask: {
      sourceCategoryId: params.collaboration.sourceCategoryId,
      ownerEmail: params.collaboration.ownerEmail.trim().toLowerCase(),
      createdByEmail: params.collaboration.createdByEmail.trim().toLowerCase(),
      createdByName: params.collaboration.createdByName?.trim() || undefined,
    },
  };
  list.push(task);
  saveRaw(list);
  notifySharedTasksChanged();
  return task;
}

export function updateCollaborativeTask(id: number | string, patch: Partial<Tarefa>): Tarefa | null {
  const list = loadRaw();
  const sid = String(id);
  const idx = list.findIndex((t) => String(t.id) === sid);
  if (idx < 0) return null;
  const prev = list[idx];
  const sharedTask = prev.sharedTask;
  if (!sharedTask) return null;
  const next: Tarefa = {
    ...prev,
    ...patch,
    id: prev.id,
    uuid: prev.uuid,
    sharedTask,
  };
  list[idx] = next;
  saveRaw(list);
  notifySharedTasksChanged();
  return next;
}

export function deleteCollaborativeTask(
  id: number | string,
  viewerEmail: string
): { ok: true } | { ok: false; message: string } {
  const v = viewerEmail.trim().toLowerCase();
  const list = loadRaw();
  const sid = String(id);
  const idx = list.findIndex((t) => String(t.id) === sid);
  if (idx < 0) return { ok: false, message: "Tarefa não encontrada." };
  const t = list[idx];
  if (!t.sharedTask) return { ok: false, message: "Tarefa inválida." };
  if (t.sharedTask.createdByEmail !== v) {
    return { ok: false, message: "Só quem criou a tarefa pode excluí-la." };
  }
  list.splice(idx, 1);
  saveRaw(list);
  notifySharedTasksChanged();
  return { ok: true };
}

export type OwnedCategoryLite = { id: string; objectives: { id: number | string }[] };

/**
 * Se a tarefa recém-criada (fluxo normal) pertence a uma categoria sua com compartilhamento ativo,
 * grava cópia colaborativa e retorna essa versão (substitui o uso da resposta crua do POST).
 */
export function tryMirrorNewOwnerTaskToCollaborativeStore(
  task: Tarefa,
  viewerEmail: string,
  viewerName: string,
  ownedCategories: OwnedCategoryLite[]
): Tarefa | null {
  const em = viewerEmail.trim().toLowerCase();
  if (!em || task.sharedTask) return null;
  for (const cat of ownedCategories) {
    const objIds = new Set(cat.objectives.map((o) => o.id));
    if (!objIds.has(task.idObjective)) continue;
    const shares = listActiveSharesForCategory(cat.id, em);
    if (shares.length === 0) continue;
    return addCollaborativeTask({
      task: {
        nameTask: task.nameTask,
        descriptionTask: task.descriptionTask,
        status: task.status,
        dateTask: task.dateTask,
        idObjective: task.idObjective,
        isRecurring: task.isRecurring,
        recurringDays: task.recurringDays,
        recurringUntil: task.recurringUntil,
        cancellationReason: task.cancellationReason,
        subtasks: task.subtasks,
      },
      collaboration: {
        sourceCategoryId: cat.id,
        ownerEmail: em,
        createdByEmail: em,
        createdByName: viewerName.trim() || undefined,
      },
    });
  }
  return null;
}
