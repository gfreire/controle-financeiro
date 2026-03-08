export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}