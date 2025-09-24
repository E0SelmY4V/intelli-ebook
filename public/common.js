/**
 * @typedef {string | number | symbol | null | undefined | boolean} Tostrable
 */

/**
 * 字符串拼出错误
 * @param {...string} infos 错误信息
 */
function getError(...infos) {
	return Error(infos.join('\n'));
}

/**
 * 显示大红色错误页面并终止
 * @param {Error} error 错误信息
 * @param {boolean} [front=true] 是否是前端发生的错误
 * @returns {never}
 */
function wrong(error, front = true) {
	if (!error) wrong(Error('没有提供错误'));
	if (wrong.errorsNow.size) {
		wrong.errorsNow.add(error);
		if (!wrong.errorsNow.size) throw error;
		const aErr = new AggregateError(wrong.errorsNow, '多个错误');
		if (!wrong.pre) {
			wrong.errorsNow.clear();
			wrong(aErr);
		}
		wrong.pre.innerText = aErr.toString();
		throw aErr;
	}
	wrong.errorsNow.add(error);
	const div = document.createElement("div");
	div.innerHTML = `
		<h1>我的天啊${front ? '页面' : '后台'}出问题了！</h1>
		<br />
		<hr color="#fff" />
		<br />
		<p>请你带着以下错误报告向管理员汇报，或者重试一下？</p>
	`;
	div.id = 'wrong_div';
	const pre = wrong.pre = document.createElement('pre');
	pre.innerText = error.toString();
	div.appendChild(pre);
	document.children[0].appendChild(div);
	throw error;
}
/**@type {Set<Error>} */
wrong.errorsNow = new Set();
/**@type {HTMLPreElement | null} */
wrong.pre = null;

/**
 * 用 wrong 函数包装可能报错的操作
 * @template T
 * @param {() => T} fn 可能报错的操作
 * @returns {T} 操作结果
 */
function tryFn(fn) {
	try {
		return fn();
	} catch (error) {
		wrong(error);
	}
}

/**
 * 发起网络请求，若有错误则显示大红色错误页面
 * @param {string} url 请求地址
 * @param {RequestInit} init 请求配置
 * @returns {Promise<Response>} 请求结果
 */
async function req(url, init) {
	const r = await tryFn(() => fetch(url, init));
	if (!r.ok) wrong(getError(
		`${r.status} ${r.statusText}`,
		'',
		Array.from(r.headers.entries()).map(([k, v]) => `${k}: ${v};`).join('\n'),
		await r.text(),
	));
	return r;
}
/**
 * 显示页面顶部提示
 * 必须在 onload 里用
 * @param {Tostrable} title 标题
 * @param {Tostrable} body 内容
 * @param {HTMLElement} [node=document.body.children[0]] 需要被操作的元素
 * @param {boolean} [before=true] 在 node 前插入，而不是作为其内部第一个元素
 */
function showInfo(title, body, node = document.body.children[0], before = true) {
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
	console.log(title, body);
	tryFn(() => {
		if (before) node.parentNode.insertBefore(div, node);
		else if (node.children[0]) node.insertBefore(div, node.children[0]);
		else node.appendChild(div);
	});
}

/**页面所带的参数 */
const query = new URLSearchParams(window.location.search);

onload = () => tryFn(() => {
	// 初始化表单的状态标记
	document.getElementsByName("from_input").forEach(n => n.value = location);
	document.getElementsByName('step').forEach(n => n.value ||= n.parentNode.parentNode.dataset.step);
	setOnload.fns.forEach(tryFn);
});
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
