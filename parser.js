// Imports
const puppeteer = require("puppeteer");
const fs = require("fs/promises");

// Consts
const linkAppend = "https://www.amazon.com/dp/";
const defaultSizing = [
  {color: [
  'Black',
  'White',
  'Blue',
  'Green',
  'Grey',
  'Clear',
  'Red',
  'Purple',
  'Brown',
  'Multicolor',
  'Aqua',
  'Assorted',
  ]},
  {material: [
    'Wood',
    'Plastic',
    'Rubber',
    'Stone',
    'Leather',
    'Fur',
    'Synthetic',
  ]},
  {size: [
    'Small',
    'Medium',
    'Large',
    '1 Pack',
    '1Pack',
    'inch',
    'oz',
    'count',
  ]},
  {style: [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]}
];

(async () => {
  // Iterate variables
  let number = 0;

  // Loop variables
  let keepChecking = 0;

  // Puppeteer presets
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(60000);

  // // Create files
  await fs.writeFile("./result/Rerun.txt", "");

  const checkLinks = async () => {
    // .readFile functions
    const rawLinks = await fs.readFile("./toCheck/links.txt", "utf-8");
    const checkForRerun = await fs.readFile("./result/Rerun.txt", "utf-8");

    // Functional lists
    let links = [];
    if (checkForRerun.slice(" ").slice("\n").length == 0) {
      links = rawLinks.split("\n");
    } else {
      links = checkForRerun.split("\n");
      await fs.writeFile("./result/Rerun.txt", "");
    }

    // File variables 
    let titleForFile;
    let brandForFile;
    let partNumberForFile;
    let photosForFile;
    let sizingForFile;
    let productTypeForFile;

    // Product Check
    for (let i = 0; i < links.length; i++) {
      let link;

      if(links[i].length === 10) {
        link = linkAppend + links[i]
      } else {
        link = links[i]
      };

      // Redirection to product page
      await page.goto(link, { waitUntil: "networkidle2" });
      const botCheck = await page.evaluate(() => {
        return document.querySelector(".a-padding-extra-large");
      });

      if(botCheck) {
        continue
      }

      await page.waitForTimeout(1000)

      // Get brand name
      const brandName = await page.evaluate(() => {
        try {
          return document.querySelector("#bylineInfo").textContent;
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
      brandForFile = checkAndSlice(brandName);

      // Page evaluate
      const pageValues = await page.evaluate(() => {
        const title = document.querySelector('#productTitle').textContent;
        const sizingParentNoVarsFirst = Array.from(document.querySelectorAll('.a-cardui-body > div > div > span')).map((x) => x.textContent)
        const sizingParentNoVarsSecond = Array.from(document.querySelectorAll('#twister > div > div')).map((x) => x.textContent)
        const sizingParentFirst = Array.from(document.querySelectorAll('.inline-twister-dim-title-value-truncate-expanded > span')).map((x) => x.textContent)
        const sizingParentSecond = Array.from(document.querySelectorAll('#twister > div > div')).map((x) => x.textContent)
        const partNumberLi = Array.from(document.querySelectorAll('#detailBullets_feature_div > ul > li > .a-list-item > span ')).map((x) => x.textContent)
        const partNumberTableTitle = Array.from(document.querySelectorAll('#productDetails_detailBullets_sections1 > tbody > tr > th')).map((x) => x.textContent)
        const partNumberTableData = Array.from(document.querySelectorAll('#productDetails_detailBullets_sections1 > tbody > tr > td')).map((x) => x.textContent)
        const productOverview = Array.from(document.querySelectorAll('#productOverview_feature_div > div > table > tbody > tr > td')).map((x) => x.textContent)
        return {title, sizingParentNoVarsFirst, sizingParentNoVarsSecond, sizingParentFirst, sizingParentSecond, partNumberLi, partNumberTableTitle, partNumberTableData, productOverview}
      })

      // Generate title for file
      const titleForFileFunc = () => {
        const includesTitle = pageValues.title.toLowerCase().includes(brandForFile.toLowerCase())
        const indexOfBrand = pageValues.title.toLowerCase().indexOf(brandForFile.toLowerCase())
        
        if(includesTitle && indexOfBrand === 8) {
          titleForFile = pageValues.title.slice(pageValues.title.toLowerCase().indexOf(brandForFile.toLowerCase())+brandForFile.length+1);
        } else {
          titleForFile = pageValues.title.slice(8);
        }
      }

      // Generate part number for file
      const partNumberForFileFunc = () => {
        if(pageValues.partNumberTableTitle.length > 0) {
          for(x=0;x<pageValues.partNumberTableTitle.length;x++) {
            if(pageValues.partNumberTableTitle[x].replaceAll(' ', '') == 'Itemmodelnumber' || pageValues.partNumberTableTitle[x].replaceAll(' ', '') == 'PartNumber') {
              partNumberForFile = pageValues.partNumberTableData[x].replace(' ', '')
              break
            }
          }
        } else {
          for(y=0;y<pageValues.partNumberLi.length;y++) {
            if(pageValues.partNumberLi[y].replaceAll(/[^a-zA-Z ]/g, '').replaceAll(' ', '') == 'Itemmodelnumber' || pageValues.partNumberLi[y].replaceAll(/[^a-zA-Z ]/g, '').replaceAll(' ', '') == 'PartNumber') {
              partNumberForFile = pageValues.partNumberLi[y+1]
              break
            }
          }
        }
      }

      // Generate sizing for files
      // const sizingForFile = () => {
      //   if 
      // }

      // Prepare variables for files
      const prepareForFile = () => {
        titleForFileFunc()
        partNumberForFileFunc()
      }

      prepareForFile()

      console.log(titleForFile);
      console.log(brandForFile);
      console.log(partNumberForFile);
      console.log(pageValues.sizingParentNoVarsFirst);
      console.log(pageValues.sizingParentNoVarsSecond);
      console.log(pageValues.sizingParentFirst);
      console.log(pageValues.sizingParentSecond);
      console.log(pageValues.productOverview);
      

      if (botCheck) {
      await fs.appendFile("./result/Rerun.txt", links[i] + "\n");}

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
