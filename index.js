const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const upload = require('./upload');
const pdfCreator = require('./pdfCreator');
const app = express();
const port = 80;
app.use(cors());
app.use(bodyParser.json());


  app.post('/uploadToIsn', async (req, res) => {
    const key = req.body.key;
    const secret = req.body.secret;
    const oid = req.body.oid;
    const report = req.body.report;

    console.log(req.body);
    res.send(req.body);

    
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
  });

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`));


