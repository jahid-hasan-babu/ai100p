export const searchFilter = (search: string | null) => {
  if (!search) {
    return undefined;
  }

  return {
    status: {
      equals: search as any, // Cast `search` to match enum type
    },
  };
};
