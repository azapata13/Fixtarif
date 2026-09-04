import { logServerError } from "@/lib/security/public-errors";

const USITC_HTS_SEARCH_URL = "https://hts.usitc.gov/reststop/search";

type UsitcHtsEntry = {
  description?: string | null;
  general?: string | null;
  htsno?: string | null;
  other?: string | null;
  special?: string | null;
  units?: string[] | null;
};

export type HtsSearchResult = {
  description: string;
  generalRate: string | null;
  htsno: string;
  otherRate: string | null;
  specialRate: string | null;
  units: string[];
};

function normalizeCode(value: string) {
  return value.replace(/\D/g, "");
}

function cleanDescription(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEntry(entry: UsitcHtsEntry): HtsSearchResult | null {
  const htsno = entry.htsno?.trim();
  const description = cleanDescription(entry.description);

  if (!htsno || !description) {
    return null;
  }

  return {
    description,
    generalRate: entry.general?.trim() || null,
    htsno,
    otherRate: entry.other?.trim() || null,
    specialRate: entry.special?.trim() || null,
    units: Array.isArray(entry.units) ? entry.units.filter(Boolean) : [],
  };
}

export async function searchHtsEntries(query: string) {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2 || trimmedQuery.length > 80) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `${USITC_HTS_SEARCH_URL}?keyword=${encodeURIComponent(trimmedQuery)}`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`USITC HTS search failed with status ${response.status}`);
    }

    const data = (await response.json()) as UsitcHtsEntry[];

    return data
      .map(normalizeEntry)
      .filter((entry): entry is HtsSearchResult => Boolean(entry))
      .slice(0, 8);
  } catch (error) {
    logServerError({ action: "search_hts_entries", error });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function findHtsEntryByCode(htsCode: string) {
  const normalizedTarget = normalizeCode(htsCode);
  const results = await searchHtsEntries(htsCode);

  return results.find((result) => normalizeCode(result.htsno) === normalizedTarget) ?? null;
}
