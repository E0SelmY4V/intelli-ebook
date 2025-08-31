/**@type {(error: Error | readonly string[], front: boolean) => never)} */
function wrong(error, front = true) {
	error = Array.isArray(error) ? error.join('\n') : error?.toString() ?? 'Unknown';
	const div = document.createElement("div");
	div.innerHTML = `
		<h1>我的天啊${front ? '页面' : '后台'}出问题了！</h1>
		<br />
		<hr color="#fff" />
		<br />
		<p>请你带着以下错误报告向管理员汇报，或者重试一下？</p>
		<pre id="wrong_explain_pre">${error}</pre>
	`;
	div.id = 'wrong_div';
	document.children[0].appendChild(div);
	throw error;
}
/**@type {(url: string, init: RequestInit) => Promise<Response>} */
async function req(url, init) {
	const r = await fetch(url, init);
	if (!r.ok) wrong([
		`${r.status} ${r.statusText}`,
		'',
		Array.from(r.headers.entries()).map(([k, v]) => `${k}: ${v};`).join('\n'),
		await r.text(),
	]);
	return r;
}
/**必须在 onload 里用 */
function showInfo(title, body) {
	const div = document.createElement('div');
	div.innerHTML = `
		<h2>${title}</h2>
		<p>${body}</p>
	`;
	const span = document.createElement("span");
	span.id = 'info_close_span';
	span.innerHTML = 'x';
	span.onclick = () => document.body.removeChild(div);
	div.appendChild(span);
	div.id = 'info_div';
	console.log(title, body)
	document.body.insertBefore(div, document.body.children[0]);
}

const query = new URLSearchParams(window.location.search);

onload = () => {
	document.getElementsByName("from_input").forEach(n => n.value = location);
	setOnload.fns.forEach(f => f());
};
function setOnload(fn) {
	setOnload.fns.push(fn);
}
setOnload.fns = [];
