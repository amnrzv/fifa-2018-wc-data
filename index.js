const download = require('download-file');
const fs = require('fs');
const PDFParser = require('pdf2json');
const request = require('request');

const pdfParser = new PDFParser();

const url =
  'https://resources.fifa.com/image/upload/eng-57-0706-uru-fra-uru-teamstatistics-pdf-2982508.pdf?cloudid=t6sihe2igmxt49hyzorw';

var pdfPipe = request({ url: url, encoding: null }).pipe(pdfParser);

pdfPipe.on('pdfParser_dataError', err => console.error(err));
pdfPipe.on('pdfParser_dataReady', pdf => {
  const dataArr = pdf.formImage.Pages[0].Texts

  let text = dataArr.map(x => x.R[0].T).join('\t')
  text = decodeURIComponent(text);
  text = text.replace(/#/g,'\n\n #')

  const playerData = text.split('\n\n')[2]
  let players = playerData.replace(/(\d+\s[A-Z.\s]{2,}){1,}/g, '\n\n$1')
  fs.writeFile('test2.txt', players, err => console.error(err))
});
