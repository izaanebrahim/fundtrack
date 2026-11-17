// Shared investor position maths, so every page shows the same numbers.
//
// Uses the average-cost method: a withdrawal removes units at the investor's
// average purchase NAV, so "invested" is the cost of the units still held.
export function computeClientPosition(transactions = []) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
  );

  let units = 0;
  let invested = 0;
  sorted.forEach(t => {
    if (t.type === 'INVEST') {
      units += Number(t.units);
      invested += Number(t.amount);
    } else if (t.type === 'WITHDRAW') {
      const avgNav = units > 0 ? invested / units : 0;
      units -= Number(t.units);
      invested -= Number(t.units) * avgNav;
    }
  });

  // Clamp: if fully exited, both should be 0
  if (units <= 0.0001) { units = 0; invested = 0; }
  if (invested < 0) invested = 0;

  return { units, invested, averageNav: units > 0 ? invested / units : 0 };
}
