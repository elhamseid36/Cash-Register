let price = 19.5;
let cid = [
  ["PENNY", 1.01],
  ["NICKEL", 2.05],
  ["DIME", 3.1],
  ["QUARTER", 4.25],
  ["ONE", 90],
  ["FIVE", 55],
  ["TEN", 20],
  ["TWENTY", 60],
  ["ONE HUNDRED", 100]
];

// Get references to HTML elements
const cashInput = document.getElementById("cash");
const purchaseBtn = document.getElementById("purchase-btn");
const changeDueDiv = document.getElementById("change-due");
const priceDisplay = document.getElementById("price-display");

// Update the displayed price
priceDisplay.textContent = `$${price.toFixed(2)}`;

// Define currency denominations and their values
const currencyValues = {
  "PENNY": 0.01,
  "NICKEL": 0.05,
  "DIME": 0.1,
  "QUARTER": 0.25,
  "ONE": 1,
  "FIVE": 5,
  "TEN": 10,
  "TWENTY": 20,
  "ONE HUNDRED": 100
};

purchaseBtn.addEventListener("click", () => {
    // Get the cash amount from the input, convert to a number, and fix potential floating point issues
    let cash = parseFloat(cashInput.value);

    // Round cash to two decimal places to avoid floating point inaccuracies during subtraction
    cash = Math.round(cash * 100) / 100;

    // Check if customer provided enough money
    if (cash < price) {
        alert("Customer does not have enough money to purchase the item");
        return; // Stop execution
    }

    // Check for exact change
    if (cash === price) {
        changeDueDiv.textContent = "No change due - customer paid with exact cash";
        return; // Stop execution
    }

    // Calculate change due
    let changeDue = cash - price;
    // Round changeDue to two decimal places
    changeDue = Math.round(changeDue * 100) / 100;

    // Calculate total cash in drawer
    let totalCID = cid.reduce((sum, [, amount]) => sum + amount, 0);
    totalCID = Math.round(totalCID * 100) / 100; // Round total CID

    // Handle INSUFFICIENT_FUNDS or CLOSED scenarios
    if (totalCID < changeDue) {
        changeDueDiv.textContent = "Status: INSUFFICIENT_FUNDS";
        return;
    }

    if (totalCID === changeDue) {
        let changeOutput = "Status: CLOSED";
        // If exact change, append the currency in CID. This is specific to the "CLOSED" user story test case.
        // The problem description has a specific CLOSED test case that expects the change to be shown
        // if totalCID === changeDue and the change is exactly the available currency.
        // For example, if changeDue is 0.5 and only PENNY 0.5 is available, it should be CLOSED PENNY: $0.5
        // This means we still need to calculate and display the change even when closed.
        // So we'll run the change calculation logic and then prepend "Status: CLOSED".
        // This is a subtle point based on the provided user stories.
        const calculatedChange = calculateChange(changeDue, cid, currencyValues);
        if (calculatedChange.status === "OPEN" && calculatedChange.change.length > 0) {
            changeOutput += " " + calculatedChange.change.map(([unit, amount]) => `${unit}: $${amount}`).join(" ");
        } else if (calculatedChange.status === "INSUFFICIENT_FUNDS") {
            // This means even if totalCID === changeDue, we couldn't make exact change with available denominations
            changeDueDiv.textContent = "Status: INSUFFICIENT_FUNDS";
            return;
        }
        changeDueDiv.textContent = changeOutput;
        return;
    }

    // Attempt to give change
    const result = calculateChange(changeDue, cid, currencyValues);

    if (result.status === "INSUFFICIENT_FUNDS") {
        changeDueDiv.textContent = "Status: INSUFFICIENT_FUNDS";
    } else {
        // Format the change output
        const formattedChange = result.change.map(([unit, amount]) => `${unit}: $${amount}`).join(" ");
        changeDueDiv.textContent = `Status: OPEN ${formattedChange}`;
    }
});


// Helper function to calculate change
function calculateChange(changeDue, cid, currencyValues) {
    let change = [];
    // Create a deep copy of cid to modify it
    let availableCID = JSON.parse(JSON.stringify(cid));
    availableCID.reverse(); // Start with highest denominations

    for (let i = 0; i < availableCID.length; i++) {
        let currencyName = availableCID[i][0];
        let currencyTotalAmount = availableCID[i][1];
        let currencyValue = currencyValues[currencyName];

        let amountToReturn = 0;
        // Keep subtracting the current currency value as long as changeDue is greater than or equal to it
        // and we have that currency available in the drawer.
        while (changeDue >= currencyValue && currencyTotalAmount > 0) {
            changeDue = Math.round((changeDue - currencyValue) * 100) / 100;
            currencyTotalAmount = Math.round((currencyTotalAmount - currencyValue) * 100) / 100;
            amountToReturn = Math.round((amountToReturn + currencyValue) * 100) / 100;
        }

        if (amountToReturn > 0) {
            change.push([currencyName, amountToReturn]);
        }
    }

    // If changeDue is not zero after trying to give all change, it means we couldn't give exact change.
    if (changeDue > 0) {
        return { status: "INSUFFICIENT_FUNDS", change: [] };
    }

    return { status: "OPEN", change: change };
}