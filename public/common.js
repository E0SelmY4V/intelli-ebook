/**@type {((error: Error) => never) | ((...texts: readonly string[]) => never)} */
function wrong(...text) {
	const error = text.length > 1 ? text.join('\n') : text[0].toString() ?? 'Unknown';
	const div = document.createElement("div");
	div.innerHTML = `
		<h1>我的天啊页面出问题了！</h1>
		<br />
		<hr color="#fff" />
		<br />
		<p>请你带着以下错误报告向管理员汇报，或者试试刷新也可以。</p>
		<pre id="wrong_explain_pre">${error}</pre>
	`;
	div.id = 'wrong_div';
	document.children[0].appendChild(div);
	throw error;
}
/**@type {(url: string, init: RequestInit) => Promise<Response>} */
async function req(url, init) {
	const r = await fetch(url, init);
	if (!r.ok) wrong(
		`${r.status} ${r.statusText}`,
		'',
		Array.from(r.headers.entries()).map(([k, v]) => `${k}: ${v};`).join('\n'),
		await r.text(),
	);
	return r;
}

