export const toThaiDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
