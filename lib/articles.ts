import { prisma } from "@/lib/prisma";

export const articlesPageSize = 12;

const publishedAdaptationWhere = {
  status: "published" as const,
  targetLocale: { isPublic: true },
  readingLevel: { isPublic: true }
};

export function normalizePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function paginationState(totalItems: number, currentPage: number, pageSize = articlesPageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  return {
    page,
    totalPages,
    skip: (page - 1) * pageSize,
    hasPrevious: page > 1,
    hasNext: page < totalPages
  };
}

export async function publishedArticleCards({ take, skip = 0 }: { take: number; skip?: number }) {
  const items = await prisma.contentItem.findMany({
    where: {
      adaptations: {
        some: publishedAdaptationWhere
      }
    },
    include: {
      headerMediaAsset: true,
      adaptations: {
        where: publishedAdaptationWhere,
        include: {
          readingLevel: true,
          targetLocale: true
        },
        orderBy: [{ publishedAt: "desc" }, { readingLevel: { sortOrder: "asc" } }],
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" },
    take,
    skip
  });

  return items.flatMap((item) => {
    const [adaptation] = item.adaptations;
    if (!adaptation) return [];
    const contentItem = Object.fromEntries(
      Object.entries(item).filter(([key]) => key !== "adaptations")
    ) as Omit<typeof item, "adaptations">;
    return [{ ...adaptation, contentItem }];
  });
}

export async function publishedArticleCount() {
  return prisma.contentItem.count({
    where: {
      adaptations: {
        some: publishedAdaptationWhere
      }
    }
  });
}
