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

fetch("food_expiry.json")
  .then((response) => {
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
  })
  .then((data) => {
    foodExpiryDB = data;
    form.querySelector("button[type=submit]").disabled = false;
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
      console.log(food);
      storage = whatKindofFood(food);
      console.log(storage);
      let expires;
      if (storage === "Unopened") {
        expires = "unopened";
      } else {
        const shelfLife_min = minimumShelfLife(food.name, storage);
        const shelfLife_max = maximumShelfLife(food.name, storage);
        console.log(shelfLife_min);
        // Calculate expiration date: today + 7 days
        const today = new Date();
        const expiresDateMin1 = new Date(today);
        const expiresDateMax1 = new Date(today);
        const expiresDateMin2 = new Date(today);
        const expiresDateMax2 = new Date(today);

        if (storage === "both") {
          expiresDateMin1.setDate(today.getDate() + shelfLife_min[0]);
          expiresDateMax1.setDate(today.getDate() + shelfLife_max[0]);
          expiresDateMin2.setDate(today.getDate() + shelfLife_min[1]);
          expiresDateMax2.setDate(today.getDate() + shelfLife_max[1]);

          expires = `${formatFriendlyDate(
            expiresDateMin1
          )} to ${formatFriendlyDate(
            expiresDateMax1
          )} in Pantry, ${formatFriendlyDate(
            expiresDateMin2
          )} to ${formatFriendlyDate(expiresDateMax2)} in Fridge`;
        } else {
          expiresDateMin1.setDate(today.getDate() + shelfLife_min);
          expiresDateMax1.setDate(today.getDate() + shelfLife_max);
          expires = `${formatFriendlyDate(
            expiresDateMin1
          )} to ${formatFriendlyDate(expiresDateMax1)}`;
        }
      }
      inventory.push({ name, expires, opened: false });
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
    //Todo: add it so that when this is clicked, it then calculates the opened date shelf life
    tr.addEventListener("click", function () {
      inventory[idx].opened = !inventory[idx].opened;
      renderInventory();
    });
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
  /*
  if (pantryorFridge === "pantryOpen" || pantryorFridge === "fridgeOpen"){
    return "Unopened";
  }
  if (pantryorFridge === "both" ){

  }*/
}
function minimumShelfLife(name, storage) {
  //Todo add date of purchase shelf life as same??
  const food = foodExpiryDB.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (food) {
    if (storage === "both") {
      return [food.pantry_min, food.refrigerate_min];
    }
    if (storage === "fridge") {
      return food.refrigerate_min;
    }
    if (storage === "pantry") {
      return food.pantry_min;
    }
  }
}
function maximumShelfLife(name, storage) {
  //Todo add date of purchase shelf life as same??
  const food = foodExpiryDB.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (food) {
    if (storage === "both") {
      return [food.pantry_max, food.refrigerate_max];
    }
    if (storage === "fridge") {
      return food.refrigerate_max;
    }
    if (storage === "pantry") {
      return food.pantry_max;
    }
  }
}
// Initial render
renderInventory();
