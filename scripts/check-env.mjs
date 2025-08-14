const required = ["NEXT_PUBLIC_API_BASE_URL"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing ENV:", missing.join(", "));
  process.exit(1);
}
console.log("ENV OK");
