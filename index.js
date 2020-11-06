const puppeteer = require('puppeteer');
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const upload = require('./upload');

async function main(){
  
  const key = process.argv[2];
  const secret = process.argv[3];
  const oid = process.argv[4];
  const data = process.argv[5];
  const buff = Buffer.from(data, 'base64');  
  const text = buff.toString('utf-8');
  const report = JSON.parse(text);

  //console.log(`Key: ${key}  Secret: ${secret} oid: ${oid} Report: ${report}`);
  
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
    // headless: false
  });
  let page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1000});
  
  let saveLocation = report.address.trim().replace(/\s|,|-|\.|\/|\\,/g, '_').replace(/\_+/g, '_') + '.pdf';
  let templateHtml = fs.readFileSync(path.join(process.cwd(), 'reportTemplate.html'), 'utf8');
  let template = handlebars.compile(templateHtml);
  let html = template(report);

  await page.setContent(html, {
    waitUntil: 'networkidle0'
  });
  
  let options = {
    printBackground: true,
    path: saveLocation
  }
  page.pdf(options);
  
  await upload.init({key: key, secret: secret, oid: oid}, saveLocation, page);
  fs.unlinkSync(saveLocation);
  await browser.close();
}
main().then(()=>{process.exit();}).catch((err)=>{ console.log(err); fs.writeFile('./error.txt', 'Errors: '+err,()=>{process.exit();})});