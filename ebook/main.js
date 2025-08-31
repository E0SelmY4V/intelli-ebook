/// <reference path="../public/common.js" />

/**@type {() => number} */
function getCid() {
	const a = new URLSearchParams(window.location.search);
	return a.get("cid") ?? wrong(Error("不知道用户要看什么章节"));
}

async function getBookNow() {
	const cid = getCid();
	const text = await (await req(`./book_${cid}`)).text();
	view_div.innerHTML = text;
}

