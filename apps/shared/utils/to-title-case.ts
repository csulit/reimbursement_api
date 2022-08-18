export const toTitleCase = (str: string) => {
  if (!str) {
    return '';
  }

  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
};
