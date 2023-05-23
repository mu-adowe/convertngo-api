const express = require("express");
const units = require("./units");
const app = express();

app.get("/v1/convert", (req, res) => {
  //gets queries for from, to and value from the url
  const from = req.query.from;
  const to = req.query.to.split(",");
  const value = req.query.value;
  const path = req.path;

  //finds if it exists in units js file
  const unitFrom = units.findIndex(
    (u) => u.unit == from || u.abbrev.includes(from)
  );
  if (unitFrom > -1 && from) {
    if (to) {
      //outputs all possible values based on from value
      if (to == "all") {
        let allValues = {};
        allValues[from] = value;
        let conv = units[unitFrom];
        if (conv.validator.test(value) && value) {
          for (const inx in conv) {
            if (typeof conv[inx] === "function")
              allValues[inx] = conv[inx](value);
          }
          console.log(path);
          return res.status(200).send(allValues);
        }
        return res.status(400).send({ error: "invalid input type." });
      }
      let toObject = {};
      to.forEach((toConv) => {
        let abbrevToConv = -700;
        // if (units.findIndex(u => u.abbrev.includes(toConv)) < 0) return res
        //   .status(400)
        //   .send({ error: "Missing to value or invalid to value." });
        if (units.findIndex(u => u.abbrev.includes(toConv)) > -1){
          abbrevToConv = units[units.findIndex(u => u.abbrev.includes(toConv))].unit
        }
        //finds if the function exists in units js file
        if (typeof units[unitFrom][abbrevToConv] == "function") {
          //regular expression check for valid input
          if (units[unitFrom].validator.test(value) && value) {
            toObject[abbrevToConv] = units[unitFrom][abbrevToConv](value);
          } else {
            return res.status(400).send({ error: "invalid input type." });
          }
        } else {
          if (to.length == 1) {
            return res
              .status(400)
              .send({ error: "Missing to value or invalid to value." });
          }
          toObject["error"] = `${toConv} does not exist.`;
        }
      });
      return res.status(200).send(toObject);
    }
    return res
      .status(400)
      .send({ error: "Missing to value or invalid to value." });
  }
  return res
    .status(400)
    .send({ error: "Missing from value or invalid from value." });
});

app.get("/v1/ping", (_, res) => {
  res.json({ success: true });
});

app.get("/v1", (_, res) => {
  res.json({ version: 1.0 });
});

app.get("/", function (req, res) {
  res.json({
    welcome:
      "Go to /v1/help for all valid from and to units. To convert use the path /v1/convert?from=fromvalue&to=tovalue&value=input. Example convertngo.alwaysdata.net/v1/convert?from=c&to=fahrenheit&value=14. If you want all to values just set to=all",
  });
});

//help for finding valid units to convert
app.get("/v1/help", (_, res) => {
  // gets all units, abbrev. and functions that you can use in the api
  let unitNames = units.map((unitObject) => {
    const toArray = [];
    const helpObject = {};

    helpObject.From = [...new Set([unitObject.unit, ...unitObject.abbrev])];

    for (const index in unitObject) {
      if (typeof unitObject[index] === "function") {
        const finalVal = units.map(u => u.unit).indexOf(index)

        if (finalVal > -1)
          toArray.push(units[finalVal].abbrev);
      }
    }

    helpObject.To = toArray;

    return helpObject;
  });

  // prints out map units
  res.json({ result: unitNames });
});

app.listen(process.env.PORT, function () {
  console.log("ConvertNGO api is running...");
});
