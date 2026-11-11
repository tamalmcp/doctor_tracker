function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPagination(query = {}, defaults = { page: 1, limit: 10, maxLimit: 100 }) {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page);
  const rawLimit = parseInt(query.limit, 10) || defaults.limit;
  const limit = Math.min(defaults.maxLimit, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginationMeta({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

function buildDateRangeFilter(startDate, endDate) {
  if (!startDate && !endDate) {
    return null;
  }
  const filter = {};
  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) {
      start.setUTCHours(0, 0, 0, 0);
      filter.$gte = start;
    }
  }
  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setUTCHours(23, 59, 59, 999);
      filter.$lte = end;
    }
  }
  return Object.keys(filter).length > 0 ? filter : null;
}

module.exports = {
  escapeRegex,
  buildPagination,
  buildPaginationMeta,
  buildDateRangeFilter,
};
