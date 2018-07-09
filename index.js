const download = require('download-file');
const fs = require('fs');
const PDFParser = require('pdf2json');
const request = require('request');
const Xray = require('x-ray');
const phantom = require('x-ray-phantom');


const pdfParser = new PDFParser();
const x = Xray().driver(phantom({webSecurity:false}));
const page = 'https://www.fifa.com/worldcup/matches/match/300331543/#match-info';


x.delay(5000, 8000)(page, 'body@html')
.write('output.txt')

const url =
  'https://resources.fifa.com/image/upload/eng-57-0706-uru-fra-uru-teamstatistics-pdf-2982508.pdf?cloudid=t6sihe2igmxt49hyzorw';

function readPdf(url) {
  const pdfPipe = request({ url: url, encoding: null }).pipe(pdfParser);

  pdfPipe.on('pdfParser_dataError', err => console.error(err));
  pdfPipe.on('pdfParser_dataReady', pdf => {
    const dataArr = pdf.formImage.Pages[0].Texts;

    let text = dataArr.map(x => x.R[0].T).join('\t');
    text = decodeURIComponent(text);
    text = text.replace(/#/g, '\n\n #');
    text = text.replace(/\,/g, '');

    let playerData = text.split('\n\n')[2];

    playerData = playerData.replace(/(\d+\s[A-Z.\s]{2,}){1,}/g, '\n\n$1');

    // const tableMatchPattern = /(\d+)(.+)(\s\d+\'\d+\")(\s+\d+){1,3}(\s+\d+%){0,3}\s+(\d+)\s+(\d+\.?){1,}(\s+\d+%){1,5}/

    let players = playerData
      .split('\n\n')
      .filter(x => x.match(/^\d/))
      .map(x =>
        x
          .split('\t')
          .map(x => x.trim())
          .filter(y => y.length > 0)
      )
      .map(fillUp)
      .map(x => {
        return {
          name: x[1],
          time: x[2].replace(`'`, 'm').replace(`"`, 's'),
          distanceRan: x[3],
          sprints: x[9],
          topSpeed: x[10]
        };
      });

    fs.writeFile('test.txt', JSON.stringify(players, null, 2), (err, data) => {
      if (err) console.error(err);
    });
  });
}

function fillUp(arrItem) {
  function checkAndAdd(index, search, replace) {
    if (arrItem.length < index + 1 || !arrItem[index].includes(search)) {
      arrItem = arrItem
        .slice(0, index)
        .concat(replace)
        .concat(arrItem.slice(index, arrItem.length));
    }
  }

  checkAndAdd(6, '%', '0%');
  checkAndAdd(7, '%', '0%');
  checkAndAdd(8, '%', '0%');
  checkAndAdd(14, '%', '0%');
  checkAndAdd(15, '%', '0%');
  return arrItem;
}
