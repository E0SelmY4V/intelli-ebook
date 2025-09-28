import getPandoc from './pandoc';
import * as fsp from 'fs/promises';
import * as fs from 'fs';
import { Readable } from 'stream';


(async () => {
	const docx1 = await fsp.readFile('../1 Limit 1.docx');
	const docx2 = await fsp.readFile('../Derivaitve 1.docx');
	const response = new Response(Readable.toWeb(fs.createReadStream('../pandoc.wasm')) as any, { headers: { 'content-type': 'application/wasm' } });
	const pandoc = await getPandoc(response);
	new TextDecoder('UTF-8').decode(pandoc('-f docx -t markdown --mathjax --extract-media=.', docx1));
	console.dir(getPandoc.getMedia(), { depth: 1 });
	new TextDecoder('UTF-8').decode(pandoc('-f docx -t markdown --mathjax --extract-media=.', docx2));
	console.dir(getPandoc.getMedia(), { depth: 1 });
	console.log(getPandoc.fs.dir.contents.get('media'));
})();


