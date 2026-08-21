import type { LedgerSubject } from "../types";
import { sortSubjectsByCode } from "./validate";

export function filterSubjectTree(subjects: LedgerSubject[], match: (item: LedgerSubject) => boolean): Set<string> {
  const byId = new Map(subjects.map((item) => [item.id, item]));
  const children = new Map<string, string[]>();
  for (const item of subjects) {
    if (!item.parentId) continue;
    const list = children.get(item.parentId) ?? [];
    list.push(item.id);
    children.set(item.parentId, list);
  }

  const keep = new Set<string>();
  const addAncestors = (id: string) => {
    let current = byId.get(id);
    while (current) {
      keep.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  };
  const addDescendants = (id: string) => {
    keep.add(id);
    for (const childId of children.get(id) ?? []) addDescendants(childId);
  };

  for (const item of subjects) {
    if (!match(item)) continue;
    addAncestors(item.id);
    addDescendants(item.id);
  }
  return keep;
}

export function flattenVisibleTree(
  subjects: LedgerSubject[],
  keep: Set<string>,
  expanded: Set<string>,
  rootIds?: string[],
): LedgerSubject[] {
  const childrenOf = new Map<string | null, LedgerSubject[]>();
  for (const item of sortSubjectsByCode(subjects)) {
    if (!keep.has(item.id)) continue;
    const list = childrenOf.get(item.parentId) ?? [];
    list.push(item);
    childrenOf.set(item.parentId, list);
  }

  const rows: LedgerSubject[] = [];
  const walk = (parentId: string | null) => {
    for (const node of childrenOf.get(parentId) ?? []) {
      if (parentId === null && rootIds && !rootIds.includes(node.id)) continue;
      rows.push(node);
      if (expanded.has(node.id)) walk(node.id);
    }
  };
  walk(null);
  return rows;
}

export function parentIdsWithChildren(subjects: LedgerSubject[]): string[] {
  const ids = new Set<string>();
  for (const item of subjects) {
    if (item.parentId) ids.add(item.parentId);
  }
  return [...ids];
}
