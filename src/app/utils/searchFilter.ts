// export const searchFilter = (search: string | null) => {
//   if (!search) {
//     return undefined;
//   }

//   return {
//     status: {
//       equals: search as any, // Cast `search` to match enum type
//     },
//   };
// };

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
