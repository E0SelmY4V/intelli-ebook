/// <reference path="../public/common.ts" />

async function getBookNow() {
	const cid = query.get('cid') ?? wrong(Error('不知道用户要看什么章节'));
	const text = await (await req(`./book_${cid}`)).text();
	gid('view_div', 'div').innerHTML = text;
}

