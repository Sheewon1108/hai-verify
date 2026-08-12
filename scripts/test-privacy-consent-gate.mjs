/**
 * Pure-logic checks for privacy consent pre-choice gate.
 * Run: node ./scripts/test-privacy-consent-gate.mjs
 */

function canEnterCookieChoice(input) {
  return (
    input.coreCommandAcknowledged &&
    input.intentMeasured &&
    input.humanApproved
  );
}

const cases = [
  {
    name: "blocks before core command",
    input: {
      coreCommandAcknowledged: false,
      intentMeasured: true,
      humanApproved: true,
    },
    expect: false,
  },
  {
    name: "blocks before intent measure",
    input: {
      coreCommandAcknowledged: true,
      intentMeasured: false,
      humanApproved: true,
    },
    expect: false,
  },
  {
    name: "blocks before human approval",
    input: {
      coreCommandAcknowledged: true,
      intentMeasured: true,
      humanApproved: false,
    },
    expect: false,
  },
  {
    name: "allows only after all three gates",
    input: {
      coreCommandAcknowledged: true,
      intentMeasured: true,
      humanApproved: true,
    },
    expect: true,
  },
];

let failed = 0;
for (const c of cases) {
  const got = canEnterCookieChoice(c.input);
  if (got !== c.expect) {
    console.error(`FAIL: ${c.name} → got ${got}, expected ${c.expect}`);
    failed += 1;
  } else {
    console.log(`PASS: ${c.name}`);
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log("All privacy consent gate checks passed.");
