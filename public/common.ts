type Tostrable = string | number | null | undefined | boolean;

/**
 * 用 id 获得元素并验证类型
 * @param id 元素 id
 * @param tag
 */
function gid<K extends keyof HTMLElementTagNameMap>(id: string, tag: K): HTMLElementTagNameMap[K] {
	const ele = document.getElementById(id) ?? wrong(getError('找不到:', id, tag));
	if (ele.tagName.toLowerCase() !== tag) wrong(getError('错误的标签', id, tag, ele.tagName));
	// @ts-ignore
	return ele;
}

/**
 * 字符串拼出错误
 * @param infos 错误信息
 */
function getError(...infos: Tostrable[]) {
	return Error(infos.join('\n'));
}

/**
 * 显示大红色错误页面并终止
 * @param error 错误信息
 * @param front 是否是前端发生的错误
 */
function wrong(error: Error, front = true): never {
	if (!error) wrong(Error('没有提供错误'));
	if (wrong.errorsNow.size) {
		wrong.errorsNow.add(error);
		if (wrong.errorsNow.size === 1) throw error;
		const aErr = new AggregateError(wrong.errorsNow, Array.from(wrong.errorsNow.values()).join('\n'));
		if (!wrong.pre.ele) {
			wrong.errorsNow.clear();
			wrong(aErr);
		}
		wrong.pre.ele.innerText = aErr.toString();
		throw aErr;
	}
	wrong.errorsNow.add(error);
	const div = document.createElement('div');
	div.innerHTML = `
		<h1>我的天啊${front ? '页面' : '后台'}出问题了！</h1>
		<br />
		<hr color="#fff" />
		<br />
		<p>请你带着以下错误报告向管理员汇报，或者重试一下？</p>
	`;
	div.id = 'wrong_div';
	const pre = wrong.pre.ele = document.createElement('pre');
	pre.innerText = error.toString();
	pre.id = 'wrong_explain_pre';
	div.appendChild(pre);
	document.children[0].appendChild(div);
	throw error;
}
namespace wrong {
	export const errorsNow = new Set<Error>();
	export const pre: { ele: HTMLPreElement | null } = { ele: null };
}

/**
 * 用 wrong 函数包装可能报错的操作
 * @param fn 可能报错的操作
 * @returns 操作结果
 */
function tryFn<T>(fn: () => T): T {
	try {
		return fn();
	} catch (error) {
		// @ts-ignore
		wrong(error);
	}
}

/**
 * 发起网络请求，若有错误则显示大红色错误页面
 * @param url 请求地址
 * @param init 请求配置
 * @returns 请求结果
 */
async function req(url: string | URL | Request, init?: RequestInit): Promise<Response> {
	const r = await tryFn(() => fetch(url, init));
	if (!r.ok) wrong(getError(
		`req in ${url} with ${JSON.stringify(init ?? null)}`,
		'',
		`${r.status} ${r.statusText}`,
		Array.from(r.headers.entries()).map(([k, v]) => `${k}: ${v};`)
			.join('\n'),
		await r.text(),
	));
	return r;
}
/**
 * 显示页面顶部提示
 * 必须在 onload 里用
 * @param title 标题
 * @param body 内容
 * @param node 需要被操作的元素
 * @param before 在 node 前插入，而不是作为其内部第一个元素
 */
function showInfo(title: Tostrable, body: Tostrable, node: Element = document.body.children[0], before = true) {
	const div = document.createElement('div');
	div.innerHTML = `
		<h2>${title}</h2>
		<p>${body}</p>
	`;
	const span = document.createElement('span');
	span.id = 'info_close_span';
	span.innerHTML = 'x';
	span.onclick = () => document.body.removeChild(div);
	div.appendChild(span);
	div.id = 'info_div';
	console.log(title, body);
	tryFn(() => {
		// @ts-ignore
		if (before) node.parentNode.insertBefore(div, node);
		else if (node.children[0]) node.insertBefore(div, node.children[0]);
		else node.appendChild(div);
	});
}

/**页面所带的参数 */
const query = new URLSearchParams(window.location.search);

onload = () => tryFn(() => {
	// 初始化表单的状态标记
	// @ts-ignore
	document.getElementsByName('from').forEach(n => n.value = location);
	// @ts-ignore
	document.getElementsByName('step').forEach(n => !n.value && (n.value = n.parentNode.parentNode.dataset.step));
	setOnload.fns.forEach(tryFn);
});
/**
 * 注册页面 onload 函数
 * @param fn 函数
 */
function setOnload(fn: () => void) {
	setOnload.fns.push(fn);
}
namespace setOnload {
	export const fns: (() => void)[] = [];
}


/**
 * 表示不需要显示表单
 */
const noForm = Symbol('no form');
/**
 * 表单标识，写在 data-step 标签里
 */
type FormStep = string | number | typeof noForm;
/**
 * 在多表单页面里显示特定表单
 * 必须在 onload 里用
 * @param step 表单标识
 */
function showForm(step: FormStep) {
	if (step === noForm) return;
	const stepStr = step.toString();
	(Array
		.from(document.getElementsByName('stepping'))
		.find(n => n.dataset.step === stepStr)
		?? wrong(getError('没有对应步骤的表单: ', step))
	).hidden = false;
}

/**
 * 页面回调状态名
 */
type CbCode = string | number;
type CbMap = Record<
	CbCode,
	[
		cbForm?: FormStep,
		action?: Parameters<typeof showInfo> | ((cbData: any[]) => void),
	]
>;
/**
 * 获得页面状态管理器
 * @param cbs 各状态对应动作
 * @param initCode 起始状态
 */
function initCallbackHandler(cbs: CbMap, initCode: CbCode = 'start') {
	const infoRaw = query.get('info');
	const callback: [CbCode | [code: CbCode, infoForm: FormStep], ...any[]] = JSON.parse(infoRaw ?? `["${initCode}"]`);
	setOnload(() => {
		const [infoHead, ...info] = callback;
		const [code, infoForm = null] = Array.isArray(infoHead) ? infoHead : [infoHead];
		const [cbForm, action] = cbs[code] ?? wrong(getError('未知回调代码: ', infoRaw));
		showForm(infoForm ?? cbForm ?? wrong(getError('没有指定显示哪一步表单: ', code, infoRaw)));
		if (typeof action === 'function') action(info);
		else if (action) showInfo(...action);
	});
}
