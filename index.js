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

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: false
  });
  var page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1000});
  
  let saveLocation = report.address.trim().replace(/\s|,|-|\.|\/|\\,/g, '_').replace(/\_+/g, '_') + '.pdf';
  var templateHtml = fs.readFileSync(path.join(process.cwd(), 'reportTemplate.html'), 'utf8');
  var template = handlebars.compile(templateHtml);
  var html = template(report);
  fs.writeFile('./report.html', html,()=>{});
  
  
  await page.goto(__dirname+'/report.html', {
    waitUntil: 'networkidle0'
  });
  
  var pdfPath = path.join('pdf', saveLocation);
  var options = {
    printBackground: true,
    path: pdfPath
  }
  await page.pdf(options).catch(()=>{});
  
  console.log('PDFpath: '+pdfPath);
  await upload.init({key: key, secret: secret, oid: oid}, pdfPath, page)
  await browser.close();
}
main();
  
  
  