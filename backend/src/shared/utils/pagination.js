export const getPagination = (query = {}) => {
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);

  return { limit, offset };
};
