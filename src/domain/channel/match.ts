import { normalizeText } from "../matching/normalize";

export function channelMatchKey(platform: string, account: string, searchField: string, keyword: string): string {
  return [normalizeText(platform), normalizeText(account), normalizeText(searchField), normalizeText(keyword)].join("|");
}
