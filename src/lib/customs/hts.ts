import { logServerError } from "@/lib/security/public-errors";

const USITC_HTS_SEARCH_URL = "https://hts.usitc.gov/reststop/search";
const MAX_HTS_RESULTS = 12;

const queryExpansions: Record<string, string[]> = {
  aluminum: ["aluminum articles", "aluminium articles"],
  bolt: ["screws bolts nuts", "7318"],
  bolts: ["screws bolts nuts", "7318"],
  bracket: ["brackets mountings fittings", "8302"],
  brackets: ["brackets mountings fittings", "8302"],
  nut: ["screws bolts nuts washers", "7318"],
  nuts: ["screws bolts nuts washers", "7318"],
  screw: ["screws bolts nuts", "7318"],
  screws: ["screws bolts nuts", "7318"],
  washer: ["screws bolts nuts washers", "7318"],
  washers: ["screws bolts nuts washers", "7318"],
};

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

  const expandedQueries = [trimmedQuery, ...(queryExpansions[trimmedQuery.toLowerCase()] ?? [])];
  const results = new Map<string, HtsSearchResult>();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    for (const searchQuery of expandedQueries) {
      if (results.size >= MAX_HTS_RESULTS) {
        break;
      }

      const url = `${USITC_HTS_SEARCH_URL}?keyword=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`USITC HTS search failed with status ${response.status}`);
      }

      const data = (await response.json()) as UsitcHtsEntry[];

      data
        .map(normalizeEntry)
        .filter((entry): entry is HtsSearchResult => Boolean(entry))
        .forEach((entry) => {
          if (results.size < MAX_HTS_RESULTS) {
            results.set(`${entry.htsno}-${entry.description}`, entry);
          }
        });
    }

    return Array.from(results.values());
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
