/**
 * @typedef {string | number | symbol | null | undefined | boolean} Tostrable
 */

/**
 * 显示大红色错误页面并终止
 * @param {Error | readonly Tostrable[]} error 错误信息
 * @param {boolean} [front=true] 是否是前端发生的错误
 * @returns {never}
 */
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
/**
 * 发起网络请求，若有错误则显示大红色错误页面
 * @param {string} url 请求地址
 * @param {RequestInit} init 请求配置
 * @returns {Promise<Response>} 请求结果
 */
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
/**
 * 显示页面顶部提示
 * 必须在 onload 里用
 * @param {Tostrable} title 标题
 * @param {Tostrable} body 内容
 */
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

/**页面所带的参数 */
const query = new URLSearchParams(window.location.search);

onload = () => {
	// 初始化表单的状态标记
	document.getElementsByName("from_input").forEach(n => n.value = location);
	document.getElementsByName('step').forEach(n => n.value ||= n.parentNode.parentNode.dataset.step);
	setOnload.fns.forEach(f => f());
};
/**
 * 注册页面 onload 函数
 * @param {() => void} fn 函数
 */
function setOnload(fn) {
	setOnload.fns.push(fn);
}
setOnload.fns = [];


/**
 * @typedef {string | number} FormStep 表单标识，写在 data-step 标签里
 */
/**
 * 在多表单页面里显示特定表单
 * 必须在 onload 里用
 * @param {FormStep} step 表单标识
 */
function showForm(step) {
	const stepStr = step.toString();
	Array
		.from(document.getElementsByName('sign_div'))
		.find(n => n.dataset.step === stepStr)
		.hidden = false;
}

/**
 * @typedef {string | number} CbCode 页面回调状态名
 */
/**
 * 页面状态管理器
 */
class CallbackHandler {
	/**
	 * @param {Record<CbCode, [cbForm: FormStep, action?: (Parameters<typeof showInfo> | ((cbData: any[]) => void))]>} cbs 各状态对应动作
	 * @param {CbCode} [initCode='start'] 起始状态
	 */
	constructor(cbs, initCode = 'start') {
		this.cbs = cbs;
		/**@type {[CbCode | [code: CbCode, form: FormStep], ...any[]} */
		this.callback = JSON.parse(query.get('info') ?? `["${initCode}"]`);
	}
	/**
	 * 管理函数
	 */
	handle = () => {
		let form;
		let code;
		let info;
		if (Array.isArray(this.callback[0])) [[code, form], ...info] = this.callback;
		else[code, ...info] = this.callback;
		const [cbForm, action] = this.cbs[code] ?? wrong(Error('未知回调代码: ' + query.get('info')));
		showForm(form ?? cbForm);
		if (typeof action === 'function') action(info);
		else if (action) showInfo(...action);
	}
}

/**
 * 初始化
 */
function initStep() {
	console.log(123);
}
