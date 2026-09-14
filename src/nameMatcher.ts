export function normalizeIndianName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/ee/g, 'i')       // Deepak -> Dipak, Preeti -> Priti
    .replace(/oo/g, 'u')       // Pooja -> Puja, Anoop -> Anup
    .replace(/ah/g, 'a')       // Nagrahle -> Nagrale
    .replace(/w/g, 'v')        // Wikas -> Vikas
    .replace(/(.)\1+/g, '$1'); // Mittal -> Mital
}