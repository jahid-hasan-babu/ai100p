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

export const sellerSearchFilter = (
  search: string | null,
  email: string | null
) => {
  if (!search && !email) {
    return undefined; // Return undefined when no filter criteria are provided
  }

  const filters: any = { OR: [] };

  if (search) {
    filters.OR.push(
      { name: { contains: search, mode: "insensitive" } },
      { userName: { contains: search, mode: "insensitive" } }
    );
  }

  if (email) {
    filters.OR.push({ email: { contains: email, mode: "insensitive" } });
  }

  // If no valid filter conditions exist, return undefined
  return filters.OR.length > 0 ? filters : undefined;
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
export const searchFilter4 = (search: string | null) => {
  if (!search) {
    return undefined;
  }

  const filters: any = {
    OR: [
      { status: { equals: search } }, // Exact match for status
    ],
  };

  return filters;
};

export const searchFilter9 = (category?: string, price?: string) => {
  if (!category && !price) {
    return {}; // If both are missing, return an empty object.
  }

  const filters: any = {};

  if (category && price) {
    filters.AND = [
      { title: { contains: category, mode: "insensitive" } },
      { price: { contains: price, mode: "insensitive" } },
    ];
  } else if (category) {
    filters.title = { contains: category, mode: "insensitive" };
  } else if (price) {
    filters.price = { contains: price, mode: "insensitive" };
  }

  return filters;
};

export const searchFilter5 = (category?: string, priceToNumber?: number) => {
  if (!category && priceToNumber === undefined) {
    return {}; // Return an empty object if no filters are provided
  }

  const filters: any = {
    AND: [],
  };

  if (category) {
    filters.AND.push({ title: { contains: category, mode: "insensitive" } });
  }

  if (priceToNumber !== undefined) {
    filters.AND.push({ price: priceToNumber });
  }

  return filters;
};


