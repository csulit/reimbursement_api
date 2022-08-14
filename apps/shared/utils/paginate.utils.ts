export default function paginate(page: number, limit: number) {
  if (!page) page = 1;
  if (!limit) limit = 10;

  page = page * 1 || 1;
  limit = limit * 1 || 10;
  const skip = (page - 1) * limit;

  return { page, skip, limit };
}
