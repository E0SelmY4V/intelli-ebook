/**@type {(error: Error) => never} */
function wrong(error) {
	const div = document.createElement("div");
	div.innerHTML = `
		<h1>我的天啊页面出问题了！</h1>
		<br />
		<hr color="#fff" />
		<br />
		<p>请你带着以下错误报告向管理员汇报，或者试试刷新也可以。</p>
		<pre id="wrong_explain_pre">${error.toString() || 'Unknown'}</pre>
	`;
	div.id = 'wrong_div';
	document.children[0].appendChild(div);
}

