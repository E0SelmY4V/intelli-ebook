/// <reference path="./base-common.ts" />
/// <reference path="./mods.ts" />

/**当前所在的 script 标签 */
const eleNow = document.currentScript ?? panic(Error('拿不到当前所在 script 标签'));

/**
 * 引入一个网络脚本
 * @param src 脚本来源
 * @returns 脚本节点
 */
function insJs(src: string) {
	const modsEle = document.createElement('script');
	modsEle.src = src;
	eleNow.parentNode?.insertBefore(modsEle, eleNow);
	return modsEle;
}
insJs('main.js');

/**
 * 发起网络请求，若有错误则显示大红色错误页面
 * @param url 请求地址
 * @param init 请求配置
 * @returns 请求结果
 */
async function forceReq(url: string | URL | Request, init?: RequestInit): Promise<Response> {
	const r = await fetch(url, init).catch(panic);
	if (!r.ok) panic(getError(
		`req in ${url} with ${stringifyAll(init)}`,
		'',
		`${r.status} ${r.statusText}`,
		Array
			.from(r.headers.entries())
			.map(([k, v]) => `${k}: ${v};`)
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
function showInfo(title: Tostrable, body: Tostrable, node?: Element, before = true) {
	const div = gele('div', {
		nodes: [
			gele('h2', { innerHTML: `${title}` }),
			gele('p', { innerHTML: `${body}` }),
			gele('span', {
				id: 'info_close_span',
				innerHTML: 'x',
				onclick: () => document.body.removeChild(div),
			}),
		],
		id: 'info_div',
	});
	console.log(title, body);
	if (!node) {
		const bodyFirst = document.body.firstChild;
		if (bodyFirst && bodyFirst instanceof HTMLElement) node = bodyFirst;
		else {
			before = false;
			node = document.body;
		}
	}
	if (before) node.parentNode?.insertBefore(div, node);
	else node.insertBefore(div, node.firstChild);
}

/**页面所带的参数 */
const query = new URLSearchParams(window.location.search);

onload = () => {
	// 初始化表单的状态标记
	for (const ele of document.getElementsByName('from')) {
		if (!(ele instanceof HTMLInputElement)) panic(Error('不是表单元素', { cause: ele }));
		ele.value = location.toString();
	}
	for (const ele of document.getElementsByName('step')) {
		if (!(ele instanceof HTMLInputElement)) panic(Error('不是表单元素', { cause: ele }));
		if (ele.value) continue;
		const step = ele.parentElement?.parentElement?.dataset.step ?? panic(Error('父节点没有 step', { cause: ele }));
		ele.value = step;
	}
	setOnload.fns.forEach(panicable);
};
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


/**表示不需要显示表单 */
const noForm = Symbol('no form');
/**表单标识，写在 data-step 标签里 */
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
		?? panic(getError('没有对应步骤的表单: ', step))
	).hidden = false;
}

/**页面回调状态名 */
type CbCode = string | number;
/**使用回调给的表单 */
const cbForm = Symbol('Use callback form');
type Statics<
	T,
	R extends any[] = [],
> = T extends readonly [infer N extends TSchema, ...infer L extends readonly TSchema[]]
	? Statics<L, [...R, Static<N>]>
	: R;
type CbArgTypes<K extends CbCode> = Partial<Record<K, readonly TSchema[]>>;
/**状态规则 */
type CbMap<K extends CbCode, T extends CbArgTypes<K>> = {
	[I in K]: [
		cbForm: FormStep | typeof cbForm,
		action?: (I extends keyof T
			? ((...cbData: Statics<T[I]>) => void)
			: ((() => void) | Parameters<typeof showInfo>)
		),
	]
};
/**
 * 获得页面状态管理器
 * @param cbs 各状态对应动作
 * @param initCode 起始状态
 */
function initCallbackHandler<
	K extends CbCode,
	const T extends CbArgTypes<K> = {},
>(
	cbs: CbMap<K, T>,
	argTypes: T | null = null,
	initCode: CbCode = 'start',
) {
	function assertK(k: CbCode): asserts k is K {
		if (!(k in cbs)) panic(Error(`未知的状态码: ${stringifyAll(k)}`));
	}
	const infoRaw = query.get('info');
	const callback: [CbCode | [code: CbCode, infoForm: FormStep], ...any[]] = JSON.parse(infoRaw ?? `["${initCode}"]`);
	setOnload(() => {
		const [infoHead, ...info] = callback;
		const [code, infoForm = null] = Array.isArray(infoHead) ? infoHead : [infoHead];
		assertK(code);
		const [localForm, action] = cbs[code];
		showForm(
			(localForm === cbForm ? infoForm : localForm)
			?? panic(getError('没有指定显示哪一步表单: ', code, infoRaw)),
		);
		if (typeof action === 'function') {
			const tup = Type.Tuple(argTypes?.[code]?.slice(0) ?? []);
			if (!Value.Check(tup, info)) panic(getError(`${code} 的回调参数类型错误`, stringifyAll(info)));
			action(...info);
		} else if (action) showInfo(...(action as [string, string]));
	});
}
