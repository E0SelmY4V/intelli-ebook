/// <reference path="../public/common.js" />

async function getBookNow() {
	const cid = query.get("cid") ?? wrong(Error("不知道用户要看什么章节"));
	const text = await (await req(`./book_${cid}`)).text();
	view_div.innerHTML = text;
}

