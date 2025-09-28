import getPandoc from './pandoc';
import * as fsp from 'fs/promises';
import * as fs from 'fs';
import { Readable } from 'stream';


(async () => {
	const docx = await fsp.readFile('../1 Limit 1.docx');
	const response = new Response(Readable.toWeb(fs.createReadStream('../pandoc.wasm')) as any, { headers: { 'content-type': 'application/wasm' } });
	const pandoc = await getPandoc(response);
	const md = pandoc('-f docx -t markdown --mathjax', docx);
	console.log(md);
})();


