const puppeteer = require("puppeteer");
require("dotenv").config();

module.exports = {
  init: async function (credentials, filePath, page) {
    const NV = process.env;
    fileName = filePath.replace(/^.*[\\\/]/, "");

    await page.goto(NV.BASE_URL + NV.COMPANY);
    await page.waitForSelector("input#username");
    console.log("Page Loaded...");

    await page.click("input#username");
    await page.keyboard.type(credentials.key);
    await page.click("input#password");
    await page.keyboard.type(credentials.secret);
    await page.click("button#login");
    await page.waitForNavigation();
    console.log("Log In Successful...");

    /*Search from Search Box, and click on first Item that matches input args. */
    await page.waitForSelector("input#isn_search");

    await page.click("input#isn_search").catch(async () => {
      await page.waitForTimeout(250);
      await page.click("input#isn_search").catch(async () => {
        await page.waitForTimeout(250);
        await page.click("input#isn_search");
      });
    });

    await page.keyboard.type(credentials.oid.toString());
    await page.keyboard.press("Enter");
    await page.waitForSelector(".fastSearchResult td span");
    await page.click(".fastSearchResult td");
    console.log("Navigated to Order...");
    await page.waitForSelector("button.dropdown-toggle");
    await page.click("button.dropdown-toggle");

    /* Compare all Links to find the Upload Attachments Link, and Click it. 
            (Inner Text is only identifiable attribute, and cannot be selected for 
                manually due to random whitespace) */
    let linkTextArr = await page.$$eval("a", (links) => {
      return links.map((links) => {
        return links.innerText;
      });
    });
    let uploadLinkIndex = linkTextArr.findIndex((item) => {
      return item.match(/View\/Upload Attachments/g);
    });
    let uploadLink = (await page.$$("a"))[uploadLinkIndex];
    await uploadLink.click();
    await page.waitForNavigation();
    console.log("Navigated to Upload Page");

    /*Initialize a file chooser listener to catch when choose
                file button is pressed, then upload file from args*/
    await page.waitForSelector("a.upload-btn");
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click("a.upload-btn"), // some button that triggers file selection
    ]);
    await fileChooser.accept([filePath]);
    page.waitForSelector(".triggerUpload");
    await page.click(".triggerUpload");
    console.log("Uploaded File...");
    await page.waitForTimeout(500);

    /*make sure uploaded file is public */
    await page.waitForSelector(
      'table#attachments tbody tr a[title="Attachment is not public. Click to make public."]'
    );
    let tableRows = await page.$$("table#attachments tbody tr");
    let rowIndex;

    await new Promise((resolve) => {
      tableRows.forEach(async (tableRow, i) => {
        tableRow = await (
          await tableRow.getProperty("innerText")
        ).jsonValue();
        const regex = new RegExp(`${fileName}`,'gm');
        if (regex.test(tableRow)) {
          rowIndex = i;
        }
        if (i === tableRows.length - 1) {
          resolve();
        }
      });
    });
    try {
      let publicButton = await (await page.$$("table#attachments tbody tr"))[
        rowIndex
      ].$('a[title="Attachment is not public. Click to make public."]');
      await publicButton.click();
      console.log("Making Public...");
    } catch (error) {
      console.log(error);
      console.log("Already Public...");
    }
    await page.waitForNavigation();
    tableRows = await page.$$("table#attachments tbody tr");
    try {
      let emailButton = await (await page.$$("table#attachments tbody tr"))[
        rowIndex
      ].$('a[title="Email Attachment"]');
      await emailButton.click();
      console.log("Navigating To Email...");
    } catch (error) {
      console.log(error);
    }

    /* Build a list of buttons to click to apply correct recipients to emails, then send the emails off */
    await page.waitForNavigation();
    console.log("Building Button List...");
    let dropdowns = await page.$$("div");
    let clientDD;
    let agentDD;
    await new Promise((resolve, reject) => {
      //lock this part down, so clicking doesn't happen before all buttons are resolved
      let count = 0;
      dropdowns.forEach(async (DD, i) => {
        let innerText = await DD.$eval("strong", (node) => {
          return node.innerText;
        }).catch(() => {});

        if (/.*client.*/gim.test(innerText)) {
          clientDD = await DD.$("button.dropdown-toggle");
          count++;
        } else if (/.*buyer.*/gim.test(innerText)) {
          agentDD = await DD.$("button.dropdown-toggle");
          count++;
        } else {
          count++;
        }
        if (count === dropdowns.length) {
          resolve();
        }
      });
    });
    console.log("Recipients Added...");
    await clientDD.click();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(10);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    await agentDD.click();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(10);
    await page.keyboard.press("Enter");
    // await page.click('button#emailattachmentlink') only uncomment if you mean business.
    console.log("Emails Sent, Finishing");
  }
};
