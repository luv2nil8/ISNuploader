const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");


let report = {
    address: '150s 300e Kaysville, Utah',
    startTime: '10/29/2020  14:33',
    endTime: '10/31/2020  14:35',
    inspector: 'Hunter',
    serial: 13,
    data: [3.63,7.29,4.68,6.74,5.99,5.75,6.98,1.37,7.06,5.91,7.55,6.8,5.77,4.54,2.35,7.57,1.49,5.1,6.19,2.66,4.97,7.01,7.91,2.46,2.11,5.07,5.48,4.68,2.23,5.01,3.47,4.68,4.63,3.38,4.91,6.1,4.67,3.8,2.72,2.13,7.44,6.71,4.67,7.45,3.95,4.93,2.91,5.56],
    result: false,
    average: 4.99,
    EPAaverage: 4.99
  }

  module.exports = {
	   createPDF: async function(_report, page){
		  
    let saveLocation = _report.address.trim().replace(/\s|,|-|\.|\/|\\,/g, '_').replace(/\_+/g, '_') + '.pdf';
		var templateHtml = fs.readFileSync(path.join(process.cwd(), 'reportTemplate.html'), 'utf8');
		var template = handlebars.compile(templateHtml);
		var html = template(_report);
		fs.writeFile('./report.html', html,()=>{});
	
    
		await page.goto(__dirname+'/report.html', {
      waitUntil: 'networkidle0'
    });
    
    var pdfPath = path.join('pdf', saveLocation);
    var options = {
			printBackground: true,
			path: pdfPath
		}
		await page.pdf(options);
		return pdfPath;
	}
  }