// Tab logic
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((tc) => tc.classList.add("hidden"));
    this.classList.add("active");
    document.getElementById(this.dataset.tab).classList.remove("hidden");
  });
});

// Inventory logic
let inventory = [];
let foodExpiryDB = [];

const form = document.getElementById("grocery-form");
form.querySelector("button[type=submit]").disabled = true;

function populateDatalist() {
  const datalist = document.getElementById("item-suggestions");
  datalist.innerHTML = ""; // Clear previous options

  const suggestions = new Set();

  foodExpiryDB.forEach((item) => {
    console.log(item);
    // Add the main name
    if (item.name) suggestions.add(item.name);

    if (item.subtitle) suggestions.add(item.subtitle);

    if (item.keywords) {
      if (Array.isArray(item.keywords)) {
        item.keywords.forEach((kw) => suggestions.add(kw));
      } else if (typeof item.keywords === "string") {
        item.keywords.split(",").forEach((kw) => suggestions.add(kw.trim()));
      }
    }
  });

  // Add to datalist
  suggestions.forEach((suggestion) => {
    const option = document.createElement("option");
    option.value = suggestion;
    datalist.appendChild(option);
  });
}

fetch("food_expiry.json")
  .then((response) => {
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
  })
  .then((data) => {
    foodExpiryDB = data;
    form.querySelector("button[type=submit]").disabled = false;
    populateDatalist();
  })
  .catch((err) => {
    alert("Failed to load food_expiry.json: " + err.message);
  });
/*
fetch("./food_expiry.json")
  .then((response) => response.json())
  .then((data) => {
    foodExpiryDB = data;
    form.querySelector("button[type=submit]").disabled = false;
  });*/

document
  .getElementById("grocery-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("item-name").value.trim();
    if (name) {
      const food = foodExpiryDB.find(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );
      //storage = whatKindofFood(food);
      if (!food) {
        document.getElementById(
          "grocery-msg"
        ).textContent = `Food item not found in database :/`;
        return;
      }
      expires = ShelfLife(food);
      expires = inventory.push({
        name,
        expires,
        storage: food.storage,
        opened: false,
      });
      document.getElementById("grocery-msg").textContent = `Added ${name}`;
      this.reset();
      renderInventory();
    }
  });

function renderInventory() {
  const tbody = document.querySelector("#inventory-table tbody");
  tbody.innerHTML = "";
  inventory.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.className = item.opened ? "opened" : "";
    tr.innerHTML = `
    <td>${item.name}</td>
    <td>${item.expires}</td>
    `;
    const storage = item.storage;
    const hasAfterOpening =
      (storage?.pantry?.afteropening &&
        (storage.pantry.afteropening.min != null ||
          storage.pantry.afteropening.max != null)) ||
      (storage?.refrigerate?.afteropening &&
        (storage.refrigerate.afteropening.min != null ||
          storage.refrigerate.afteropening.max != null));

    if (hasAfterOpening) {
      tr.addEventListener("click", function () {
        inventory[idx].opened = !inventory[idx].opened;

        if (inventory[idx].opened) {
          inventory[idx].expires = calculateOpenedExpiration(
            inventory[idx].name
          );
        } else {
          inventory[idx].expires = "Unopened";
        }

        renderInventory();
      });
    }

    tbody.appendChild(tr);
  });
}
function formatFriendlyDate(date) {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  // Suffix logic
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";
  return `${month} ${day}${suffix}`;
}
/*
function whatKindofFood(product) {
  let pantryorFridge;
  if (product.pantry === 1 && product.refrigerator === 1) {
    pantryorFridge = "both";
  } else if (product.pantry === 1) {
    if (product.pantryOpen === 1) {
      pantryorFridge = "pantryOpen";
    } else {
      pantryorFridge = "pantry";
    }
  } else {
    if (product.refrigerateOpen === 1) {
      pantryorFridge = "fridgeOpen";
    } else {
      pantryorFridge = "fridge";
    }
    if (pantryorFridge === "fridgeOpen" || pantryorFridge === "pantryOpen") {
      return "Unopened";
    }
  }
  return pantryorFridge;
  
  if (pantryorFridge === "pantryOpen" || pantryorFridge === "fridgeOpen"){
    return "Unopened";
  }
  if (pantryorFridge === "both" ){

  }
}*/
function ShelfLife(food) {
  const today = new Date();
  const expiresdateminR = new Date(today);
  const expiresdatemaxR = new Date(today);
  const expiresdateminP = new Date(today);
  const expiresdatemaxP = new Date(today);
  const refrigerate = food.storage?.refrigerate ?? {};
  const pantry = food.storage?.pantry ?? {};
  let min_fridge = null;
  let max_fridge = null;
  let metric_fridge = null;

  if (refrigerate.default?.min != null) {
    min_fridge = refrigerate.default.min;
    max_fridge = refrigerate.default.max ?? null;
    metric_fridge = refrigerate.default.metric ?? null;
  } else if (refrigerate.dop?.min != null) {
    min_fridge = refrigerate.dop.min;
    max_fridge = refrigerate.dop.max ?? null;
    metric_fridge = refrigerate.dop.metric ?? null;
  }
  let min_pantry = null;
  let max_pantry = null;
  let metric_pantry = null;

  if (pantry.default?.min != null) {
    min_pantry = pantry.default.min;
    max_pantry = pantry.default.max ?? null;
    metric_pantry = pantry.default.metric ?? null;
  } else if (pantry.dop?.min != null) {
    min_pantry = pantry.dop.min;
    max_pantry = pantry.dop.max ?? null;
    metric_pantry = pantry.dop.metric ?? null;
  }
  console.log(pantry.afteropening, refrigerate.afteropening);
  if (pantry.afteropening?.metric || refrigerate.afteropening?.metric) {
    return "Unopened";
  }
  if (min_fridge !== null) {
    if (metric_fridge === "Days") {
      expiresdateminR.setDate(today.getDate() + min_fridge);
    } else if (metric_fridge === "Weeks") {
      expiresdateminR.setDate(today.getDate() + min_fridge * 7);
    } else if (metric_fridge === "Months") {
      expiresdateminR.setMonth(today.getMonth() + min_fridge);
    } else if (metric_fridge === "Years") {
      expiresdateminR.setFullYear(today.getFullYear() + min_fridge);
    } else {
      expiresdateminR.setDate(today.getDate() + min_fridge);
    }
  }
  if (max_fridge !== null) {
    if (metric_fridge === "Days") {
      expiresdatemaxR.setDate(today.getDate() + max_fridge);
    } else if (metric_fridge === "Weeks") {
      expiresdatemaxR.setDate(today.getDate() + max_fridge * 7);
    } else if (metric_fridge === "Months") {
      expiresdatemaxR.setMonth(today.getMonth() + max_fridge);
    } else if (metric_fridge === "Years") {
      expiresdatemaxR.setFullYear(today.getFullYear() + max_fridge);
    } else {
      expiresdatemaxR.setDate(today.getDate() + max_fridge);
    }
  }
  if (min_pantry !== null) {
    if (metric_pantry === "Days") {
      expiresdateminP.setDate(today.getDate() + min_pantry);
    } else if (metric_pantry === "Weeks") {
      expiresdateminP.setDate(today.getDate() + min_pantry * 7);
    } else if (metric_pantry === "Months") {
      expiresdateminP.setMonth(today.getMonth() + min_pantry);
    } else if (metric_pantry === "Years") {
      expiresdateminP.setFullYear(today.getFullYear() + min_pantry);
    } else {
      expiresdateminP.setDate(today.getDate() + min_pantry);
    }
  }
  if (max_pantry !== null) {
    if (metric_pantry === "Days") {
      expiresdatemaxP.setDate(today.getDate() + max_pantry);
    } else if (metric_pantry === "Weeks") {
      expiresdatemaxP.setDate(today.getDate() + max_pantry * 7);
    } else if (metric_pantry === "Months") {
      expiresdatemaxP.setMonth(today.getMonth() + max_pantry);
    } else if (metric_pantry === "Years") {
      expiresdatemaxP.setFullYear(today.getFullYear() + max_pantry);
    } else {
      expiresdatemaxP.setDate(today.getDate() + max_pantry);
    }
  }
  if (min_pantry !== null && min_fridge !== null) {
    return `${formatFriendlyDate(expiresdateminP)} to ${formatFriendlyDate(
      expiresdatemaxP
    )} in Pantry and ${formatFriendlyDate(
      expiresdateminR
    )} to ${formatFriendlyDate(expiresdatemaxR)} in Fridge`;
  } else if (min_pantry !== null) {
    return `${formatFriendlyDate(expiresdateminP)} to ${formatFriendlyDate(
      expiresdatemaxP
    )} in Pantry`;
  } else if (min_fridge !== null) {
    return `${formatFriendlyDate(expiresdateminR)} to ${formatFriendlyDate(
      expiresdatemaxR
    )} in Fridge`;
  }
}

function calculateOpenedExpiration(name) {
  const food = foodExpiryDB.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (food) {
    const today = new Date();
    const expiresdateminR = new Date(today);
    const expiresdatemaxR = new Date(today);
    const expiresdateminP = new Date(today);
    const expiresdatemaxP = new Date(today);
    const refrigerate = food.storage?.refrigerate ?? {};
    const pantry = food.storage?.pantry ?? {};
    const min_fridge =
      //refrigerate.default?.min ??
      //refrigerate.dop?.min ??
      refrigerate.afteropening?.min ?? null;
    const min_pantry = pantry.afteropening?.min ?? null;
    const max_fridge = refrigerate.afteropening?.max ?? null;
    const max_pantry = pantry.afteropening?.max ?? null;
    if (min_fridge !== null) {
      if (refrigerate.afteropening?.metric === "Days") {
        expiresdateminR.setDate(today.getDate() + min_fridge);
      } else if (refrigerate.afteropening?.metric === "Weeks") {
        expiresdateminR.setDate(today.getDate() + min_fridge * 7);
      } else if (refrigerate.afteropening?.metric === "Months") {
        expiresdateminR.setMonth(today.getMonth() + min_fridge);
      } else if (refrigerate.afteropening?.metric === "Years") {
        expiresdateminR.setFullYear(today.getFullYear() + min_fridge);
      } else {
        expiresdateminR.setDate(today.getDate() + min_fridge);
      }
    }
    if (max_fridge !== null) {
      if (refrigerate.afteropening?.metric === "Days") {
        expiresdatemaxR.setDate(today.getDate() + max_fridge);
      } else if (refrigerate.afteropening?.metric === "Weeks") {
        expiresdatemaxR.setDate(today.getDate() + max_fridge * 7);
      } else if (refrigerate.afteropening?.metric === "Months") {
        expiresdatemaxR.setMonth(today.getMonth() + max_fridge);
      } else if (refrigerate.afteropening?.metric === "Years") {
        expiresdatemaxR.setFullYear(today.getFullYear() + max_fridge);
      } else {
        expiresdatemaxR.setDate(today.getDate() + max_fridge);
      }
    }
    if (min_pantry !== null) {
      if (pantry.afteropening?.metric === "Days") {
        expiresdateminP.setDate(today.getDate() + min_pantry);
      } else if (pantry.afteropening?.metric === "Weeks") {
        expiresdateminP.setDate(today.getDate() + min_pantry * 7);
      } else if (pantry.afteropening?.metric === "Months") {
        expiresdateminP.setMonth(today.getMonth() + min_pantry);
      } else if (pantry.afteropening?.metric === "Years") {
        expiresdateminP.setFullYear(today.getFullYear() + min_pantry);
      } else {
        expiresdateminP.setDate(today.getDate() + min_pantry);
      }
    }
    if (max_pantry !== null) {
      if (pantry.afteropening?.metric === "Days") {
        expiresdatemaxP.setDate(today.getDate() + max_pantry);
      } else if (pantry.afteropening?.metric === "Weeks") {
        expiresdatemaxP.setDate(today.getDate() + max_pantry * 7);
      } else if (pantry.afteropening?.metric === "Months") {
        expiresdatemaxP.setMonth(today.getMonth() + max_pantry);
      } else if (pantry.afteropening?.metric === "Years") {
        expiresdatemaxP.setFullYear(today.getFullYear() + max_pantry);
      } else {
        expiresdatemaxP.setDate(today.getDate() + max_pantry);
      }
    }
    if (min_pantry !== null && min_fridge !== null) {
      return `${formatFriendlyDate(expiresdateminP)} to ${formatFriendlyDate(
        expiresdatemaxP
      )} in Pantry and ${formatFriendlyDate(
        expiresdateminR
      )} to ${formatFriendlyDate(expiresdatemaxR)} in Fridge`;
    } else if (min_pantry !== null) {
      return `${formatFriendlyDate(expiresdateminP)} to ${formatFriendlyDate(
        expiresdatemaxP
      )} in Pantry`;
    } else if (min_fridge !== null) {
      return `${formatFriendlyDate(expiresdateminR)} to ${formatFriendlyDate(
        expiresdatemaxR
      )} in Fridge`;
    }
  }
}
// Initial render
renderInventory();
