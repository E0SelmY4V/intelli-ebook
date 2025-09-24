/// <reference path="../public/common.js" />

/**@type {null | { code: number, info: any }} */
const callback = JSON.parse(query.get('info') ?? 'null');

function idleCb() {
	if (callback === null) return;
	const { code, info } = callback;
	switch (code) {
		case 0:
			showInfo('成功上传！', `可在<a href="/ebook/?cid=${info}">此处</a>查看`);
			break;
	}
}
setOnload(() => {
	idleCb();
});

