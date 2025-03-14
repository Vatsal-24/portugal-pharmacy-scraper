const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { Parser } = require("json2csv");
const xlsx = require("xlsx");

function appendDataToExcel(filePath, newData) {
   let workbook;
   let worksheet;
   let data = [];

   if (fs.existsSync(filePath)) {
     workbook = xlsx.readFile(filePath);
     worksheet = workbook.Sheets["Sponsors"];

     data = xlsx.utils.sheet_to_json(worksheet);
   } else {
     workbook = xlsx.utils.book_new();
   }
    data = data.concat(newData);
    worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sponsors", true);
    xlsx.writeFile(workbook, filePath);

   console.log("Data appended successfully!");
 }




const extractData = async () =>{
    const finalList = [];

    for (let i = 1; i <2; i++) {
        const link = "https://www.portugalio.com/farmacias/vale-de-cambra/" + i + ".html";
         const listOfProducts = await extractDataFromLink(link);
        console.log(`Count: ${listOfProducts.length}`);
        finalList.push(...listOfProducts);
    }
    console.log("Final Count : ", finalList.length)
    appendDataToExcel("./data.xlsx", finalList)
}

const cleanJSON = (jsonText) => {
    return jsonText
        .replace(/\/\*<!\[CDATA\[\*\//g, '') // Remove opening CDATA comment
        .replace(/\/\*]]>\*\//g, '') // Remove closing CDATA comment
        .trim(); // Trim extra spaces
};

const extractDataFromLink = async (link) => {
    try {
        const response = await axios.get(link, { timeout: 60000 });
        const $ = cheerio.load(response.data);

        const scriptTags = $('script[type="application/ld+json"]');
        const jsonArray = [];

        for (let i = 0; i < scriptTags.length; i++) {
            try {
                const element = scriptTags[i];
                let jsonText = $(element).text();

                jsonText = cleanJSON(jsonText); // Clean unwanted comments

                const jsonData = JSON.parse(jsonText);

                const subLink = jsonData.map;

                if (!subLink) continue; // Skip iteration if subLink is missing

                const subResponse = await axios.get(subLink, { timeout: 60000 });
                const sub$ = cheerio.load(subResponse.data);
                let subJsonText = sub$('script[type="application/ld+json"]').first().text();

                subJsonText = cleanJSON(subJsonText); // Clean comments in sub JSON
                const subJsonData = JSON.parse(subJsonText);

                const name = subJsonData.name;
                const addressObj = subJsonData.address;
                const address = `${addressObj.streetAddress} ${addressObj.postalCode} ${addressObj.addressLocality}`;
                const phone = Array.isArray(subJsonData.telephone) ? subJsonData.telephone.join(', ') : subJsonData.telephone;
                const fax = subJsonData.faxNumber || '';
                const faceBookLink = "https://" + subJsonData.url.find(link => link.includes("facebook"))?.replace(/\\/g, '');
                const obj = { name, address, phone, fax, faceBookLink };

                jsonArray.push(obj);
            } catch (error) {
                console.error("Invalid JSON in script tag:", error);
            }
        }

        console.log("Total Extracted JSON:", jsonArray.length);
        return jsonArray;

    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

module.exports = extractData;
