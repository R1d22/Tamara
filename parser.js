// Imports
const puppeteer = require("puppeteer");
const fs = require("fs/promises");

// Consts
const washington = "90001";
const link = "https://www.amazon.com/dp/B08DYHVF2K";
const linkAppend = "https://www.amazon.com/dp/";

(async () => {
  // Iterate variables
  let number = 0;

  // Loop variables
  let keepChecking = 0;

  // Puppeteer presets
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 800,
  });
  await page.setDefaultNavigationTimeout(60000);

  // Create files
  await fs.writeFile("./result/Parents_no_variations.txt", "");
  await fs.writeFile("./result/2PackBrands.txt", "");
  await fs.writeFile("./result/No_Parents.txt", "");
  await fs.writeFile("./result/Musor.txt", "");
  await fs.writeFile("./result/Rerun.txt", "");
  await fs.writeFile("./result/OutOfStock.txt", "");

  //  Swap location
  await page.goto(link);
  await page.waitForTimeout(4000);
  await page.click('[id="nav-global-location-slot"]');
  await page.waitForSelector("input.a-declarative");
  await page.waitForTimeout(4000);
  await page.type("input.a-declarative", washington);
  await page.waitForTimeout(4000);
  await page.click("#GLUXZipUpdate");
  await page.waitForTimeout(4000);
  await page.click(".a-button-input");
  await page.waitForTimeout(4000);

  const checkLinks = async () => {
    // .readFile functions
    const rawLinks = await fs.readFile("./toCheck/links.txt", "utf-8");
    const rawBrands = await fs.readFile("./toCheck/brands.txt", "utf-8");
    const checkForRerun = await fs.readFile("./result/Rerun.txt", "utf-8");

    // Functional lists
    let links = [];
    if (checkForRerun.slice(" ").slice("\n").length == 0) {
      links = rawLinks.split("\n");
    } else {
      links = checkForRerun.split("\n");
      await fs.writeFile("./result/Rerun.txt", "");
    }
    const brands = rawBrands.split(";");

    // const asins = links.map((link) => {
    //     const sliced = link.slice(26);
    //     return sliced;
    // });

    // Product Check
    for (let i = 0; i < links.length; i++) {
      // Redirection to product page
      await page.goto(links[i], { waitUntil: "domcontentloaded" });
      // await page.waitForTimeout(10000)
      const botCheck = await page.evaluate(() => {
        return document.querySelector(".a-padding-extra-large");
      });

      // Check for BSR
      //   const tableBsr = await page.evaluate(() => {
      //     return Array.from(document.getElementsByTagName("tr")).map(
      //       (x) => x.textContent
      //     );
      //   });

      //   const tableBsrCheck = tableBsr.map((x) => {
      //     if (x.indexOf("Best Sellers Rank") > -1) {
      //       return x;
      //     } else return undefined;
      //   });

      //   const nonTableBsr = await page.evaluate(() => {
      //     return Array.from(document.querySelectorAll(".a-list-item")).map(
      //       (x) => x.textContent
      //     );
      //   });

      //   const nonTableBsrCheck = nonTableBsr.map((x) => {
      //     if (x.indexOf("Best Sellers Rank") > -1) {
      //       return x;
      //     } else return undefined;
      //   });

      //   const resultTableBsr = tableBsrCheck.filter((element) => {
      //     return element !== undefined;
      //   });

      //   const resultNonTableBsr = nonTableBsrCheck.filter((element) => {
      //     return element !== undefined;
      //   });

      //   let result;

      //   if (resultTableBsr[0]) {
      //     result = resultTableBsr[0];
      //   } else {
      //     result = resultNonTableBsr[0];
      //   }

      //   const preprocessed = result
      //     .replace("Best Sellers Rank", "")
      //     .split("in")[0];
      //   const processed = preprocessed
      //     .substring(preprocessed.indexOf("#"))
      //     .replace(" ", "")
      //     .replace("#", "")
      //     .replace(",", "");
      //   console.log(processed);

      //   const category = result
      //     .replace("Best Sellers Rank", "")
      //     .split("in")[1]
      //     .split("(")[0]
      //     .replace(" ", "");
      //   console.log(category);

      // Check for out of stock
      const outOfStock = await page.evaluate(() => {
        return document.querySelector("#outOfStock");
      });

      // Check for parents
      const parents = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll(
            "#twisterContainer > div > form div[class='a-section a-spacing-small']"
          )
        );
      });

      await page.waitForTimeout(500);

      // Check for variations if there is a parent
      let variations = 0;
      if (parents.length > 0) {
        const variationsUsual = await page.evaluate(() => {
          return Array.from(document.querySelectorAll(".swatches"));
        });
        const variationsDropDown = await page.evaluate(() => {
          return Array.from(document.querySelectorAll(".aui-variation"));
        });
        const fakeVariation = await page.evaluate(() => {
          return document.querySelector(".vas-ppd-swatch-select");
        });
        if (fakeVariation) {
          variations = 0;
        }
        if (variationsUsual.length > 0 || variationsDropDown.length > 0) {
          variations = 1;
        }
      }

      // Get brand name
      const brandName = await page.evaluate(() => {
        try {
          const { textContent, innerText } =
            document.getElementById("bylineInfo");
          return textContent || innerText;
        } catch {
          return `No brand was defined`;
        }
      });

      // Slice brand name
      function checkAndSlice(stringToCheck) {
        if (stringToCheck.includes("Brand:")) {
          return stringToCheck.slice(7);
        } else if (stringToCheck.includes("Visit")) {
          return stringToCheck.slice(10, -6);
        } else {
          return `String doesn't include any check words`;
        }
      }
      const checkedAndSliced = checkAndSlice(brandName);

      // Check for 2PackBrand
      let twoPackBrand = 0;
      const checkForTwoPackBrand = async () => {
        for (let i = 0; i < brands.length; i++) {
          if (brands[i] == checkedAndSliced) {
            twoPackBrand = 1;
          }
        }
      };
      checkForTwoPackBrand();

      // Check for sellers
      const ifSellersPresent = await page.evaluate(() => {
        return document.querySelector(".olp-touch-link");
      });

      let sellerMatch = 0;
      if (ifSellersPresent) {
        await page.click("a.olp-touch-link");
        await page.waitForTimeout(4000);
        const sellers = await page.evaluate(() => {
          try {
            return Array.from(document.querySelectorAll(".a-size-small")).map(
              (x) => x.textContent
            );
          } catch {
            console.log("Seller Error");
          }
        });
        if (sellers.length > 0) {
          let sellersArray = [];
          for (let i = 0; i < sellers.length; i++) {
            if (sellers[i].split(" ").join("") == "Soldby") {
              sellerIndex = i++;
              sellersArray.push(sellers[i++]);
            }
          }
          if (sellersArray.length > 0) {
            for (let i = 0; i < sellersArray.length; i++) {
              if (
                sellersArray[i].split(" ").join("") ==
                checkedAndSliced.split(" ").join("")
              ) {
                sellerMatch = 1;
              }
            }
          }
        }
      }

      // Fill in the corresponding file
      if (botCheck) {
        await fs.appendFile("./result/Rerun.txt", links[i] + "\n");
      } else if (sellerMatch || variations > 0) {
        await fs.appendFile("./result/Musor.txt", links[i] + "\n");
      } else if (twoPackBrand == 1 && variations == 0 && !outOfStock) {
        await fs.appendFile("./result/2PackBrands.txt", links[i] + "\n");
      } else if (parents.length > 0 && variations == 0 && !outOfStock) {
        await fs.appendFile(
          "./result/Parents_no_variations.txt",
          links[i] + "\n"
        );
      } else if (parents.length == 0 && !outOfStock) {
        await fs.appendFile("./result/No_Parents.txt", links[i] + "\n");
      } else if (outOfStock) {
        await fs.appendFile("./result/OutOfStock.txt", links[i] + "\n");
      } else {
        await fs.appendFile("./result/Musor.txt", links[i] + "\n");
      }

      number++;
      console.log(number);
    }

    // Second check for files
    const secondCheckForRerun = await fs.readFile(
      "./result/Rerun.txt",
      "utf-8"
    );

    if (secondCheckForRerun.replace(" ", "").replace("\n", "").length == 0) {
      keepChecking = 1;
    }
  };

  while (keepChecking == 0) {
    await checkLinks();
  }
})();
