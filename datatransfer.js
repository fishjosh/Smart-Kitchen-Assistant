import { readFileSync, writeFileSync } from "fs";

const foodkeeperdata = JSON.parse(readFileSync("./foodkeeper.json", "utf-8"));
let result = [];

async function main() {
  const items = foodkeeperdata.sheets;
  for (let entry of items) {
    for (let row of entry.data) {
      let obj = {};
      //for (let field of row) {
      // Only include fields if they are not null
      if (entry.name === "Product") {
        obj = transformFoodItem(row);
        // min and max values just so I have both. Might just use one later.
        /* if (field.Name != null) obj.name = field.Name;
          if (field.Name_subtitle != null)
            obj.Name_subtitle = field.Name_subtitle;
          if (field.Keywords != null) obj.Keywords = field.Keywords;
          if (field.Pantry_Min != null) obj.pantry_min = field.Pantry_Min;
          if (field.Pantry_Max != null) obj.pantry_max = field.Pantry_Max;
          if (field.Pantry_After_Opening_Min != null)
            obj.pantry_after_opening_min = field.Pantry_After_Opening_Min;
          if (field.Refrigerate_After_Opening_Min != null)
            obj.refrigerate_after_opening_min =
              field.Refrigerate_After_Opening_Min;
          if (field.DOP_Refrigerate_Min != null)
            obj.DOP_Refrigerate_Min = field.DOP_Refrigerate_Min;
          if (field.DOP_Refrigerate_Max != null)
            obj.DOP_Refrigerate_Max = field.DOP_Refrigerate_Max;
          if (field.Pantry_Max != null) obj.pantry_max = field.Pantry_Max;
          if (field.Pantry_After_Opening_Max != null)
            obj.pantry_after_opening_max = field.Pantry_After_Opening_Max;
          if (field.Refrigerate_After_Opening_Max != null)
            obj.refrigerate_after_opening_max =
              field.Refrigerate_After_Opening_Max;
          if (field.Refrigerate_Min != null)
            obj.Refrigerate_min = field.Refrigerate_Min;
          if (field.Refrigerate_Max != null)
            obj.Refrigerate_max = field.Refrigerate_Max;

          //Metrics
          if (isValidTimeMetric(field.Pantry_Metric)) {
            obj.pantry_metric = field.Pantry_Metric;
            obj.pantry = 1;
          }
          if (isValidTimeMetric(field.Pantry_After_Opening_Metric)) {
            obj.pantry_after_opening_metric = field.Pantry_After_Opening_Metric;
            obj.pantry = 1;
            obj.pantryOpen = 1;
          }
          //Why doesn't it like exactly this line????
          if (isValidTimeMetric(field.DOP_Pantry_Metric)) {
            obj.DOP_Pantry_Metric = field.DOP_Pantry_Metric;
            obj.Pantry = 1;
            obj.DOP_Pantry = 1;
          }
          if (isValidTimeMetric(field.Refrigerate_Metric)) {
            obj.refrigerate_metric = field.Refrigerate_Metric;
            obj.refrigerate = 1;
          }
          if (isValidTimeMetric(field.Refrigerate_After_Opening_Metric)) {
            obj.refrigerate_after_opening_metric =
              field.Refrigerate_After_Opening_Metric;
            obj.refrigerate = 1;
            obj.refrigerateOpen = 1;
          }

          if (isValidTimeMetric(field.DOP_Refrigerate_Metric)) {
            obj.DOP_Refrigerate_Metric = field.DOP_Refrigerate_Metric;
            obj.refrigerate = 1;
            obj.DOP_Refrigerate = 1;
          } */
        //}
      }
      if (typeof obj === "object" && obj !== null) {
        const keys = Object.keys(obj);

        if (Object.keys(obj).length > 0) {
          // Remove if only name, Name_subtitle, and Keywords are present and if they are not numbers
          let noNumbers =
            keys.every(
              (k) => k === "name" || k === "Name_subtitle" || k === "Keywords"
            ) && keys.length <= 3;

          if (!noNumbers) {
            result.push(obj);
          }
        }
      }
    }
  }

  function transformFoodItem(rawData) {
    const flattened = Object.assign({}, ...rawData);
    //console.log(flattened);
    const result = {
      name: flattened.Name ?? null,
      subtitle: flattened.Name_subtitle ?? null,
      keywords: flattened.Keywords ?? null,
      storage: {},
    };

    const storageTypes = ["Pantry", "Refrigerate"];
    const subtypes = ["DOP", "After_Opening"];
    const fields = ["Min", "Max", "Metric"];

    for (const type of storageTypes) {
      const typeKey = type.toLowerCase();
      const typeData = {};

      for (const sub of subtypes) {
        const subKey = sub.replace(/_/g, "").toLowerCase();
        const entry = {};

        for (const field of fields) {
          let rawKey;
          if (sub === "DOP") {
            rawKey = `${sub}_${type}_${field}`; // DOP_Pantry_Min
          } else if (sub === "After_Opening") {
            rawKey = `${type}_${sub}_${field}`; // Pantry_After_Opening_Min
          }
          if (flattened.hasOwnProperty(rawKey)) {
            const rawValue = flattened[rawKey];
            entry[field.toLowerCase()] =
              rawValue === "Not Recommended" ||
              rawValue === "Package use-by date"
                ? null
                : rawValue;
          }
        }

        if (Object.values(entry).some((val) => val != null)) {
          typeData[subKey] = entry;
        }
      }

      const baseEntry = {};
      for (const field of fields) {
        const rawKey = `${type}_${field}`;
        if (flattened.hasOwnProperty(rawKey)) {
          const rawValue = flattened[rawKey];
          baseEntry[field.toLowerCase()] =
            rawValue === "Not Recommended" || rawValue === "Package use-by date"
              ? null
              : rawValue;
        }
      }

      if (Object.values(baseEntry).some((val) => val != null)) {
        typeData.default = baseEntry;
      }

      if (Object.keys(typeData).length > 0) {
        result.storage[typeKey] = typeData;
      }
    }
    //console.log(result);
    if (Object.keys(result.storage).length === 0) {
      return null;
    }
    return result;
  }

  //(for (let entry of items) {
  // const { Food, Storage, ShelfLife, ShelfLifeUnit, IsAfterOpening } = entry;

  writeFileSync("food_expiry.json", JSON.stringify(result, null, 2));
  console.log("Done!");
}

main();
