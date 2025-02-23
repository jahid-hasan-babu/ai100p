export const userFilter = (user: string | null) => {
  if (!user) {
    return undefined;
  }

  const filters: any = {};

  if (user) {
    filters.OR = [
      { name: { contains: user, mode: "insensitive" } },
      { userName: { contains: user, mode: "insensitive" } },
    ];
  }

  return filters;
};

export const searchFilter = (search: string | null) => {
  if (!search) {
    return undefined;
  }

  const filters: any = {};

  if (search) {
    filters.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { userName: { contains: search, mode: "insensitive" } },
    ];
  }

  return filters;
};

export const searchFilter3 = (search: string | null) => {
  if (!search) {
    return undefined;
  }

  const filters: any = {};

  if (search) {
    filters.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { about: { contains: search, mode: "insensitive" } },
    ];
  }

  return filters;
};

export const searchFilter2 = (search: string | null) => {
  if (!search) {
    return undefined;
  }

  const filters: any = {};

  if (search) {
    filters.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }

  return filters;
};
