import Pandoc from './pandoc';
import * as fsp from 'fs/promises';
import * as fs from 'fs';
import { Readable } from 'stream';

(async () => {
	const response = new Response(Readable.toWeb(fs.createReadStream('../pandoc.wasm')) as any, { headers: { 'content-type': 'application/wasm' } });
	const pandoc = new Pandoc(response);
	await pandoc.init();
	const docx1 = await fsp.readFile('../1 Limit 1.docx');
	const { data, medias } = pandoc.parseSync('-f docx -t json --mathjax --extract-media=xxx', docx1, 'xxx/media');
	const text = new TextDecoder('UTF-8').decode(data);
	// console.log(JSON.stringify(JSON.parse(text), null, 2));
	console.log(medias);
})();


