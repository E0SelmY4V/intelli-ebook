/// <reference path="./mods.ts" />

type Tostrable = string | number | null | undefined | boolean;
type Dereadonly<T> = { -readonly [K in keyof T]: T[K] };

/**
 * 合并两个对象
 * @param from 源对象
 * @param to 目标对象
 * @param skipKeys 源对象要忽略的键
 */
function merge<T, K extends string>(
	from: (Partial<Readonly<Omit<T, K>>> & Record<K, unknown>) | undefined,
	to: T,
	skipKeys: Set<K> | readonly K[],
): void;
function merge<T>(from: Partial<Readonly<T>> | undefined, to: T): void;
function merge(
	from: Record<string, unknown> | undefined,
	to: Record<string, unknown>,
	skipKeys?: Set<string> | readonly string[],
) {
	if (from === void 0) return;
	const filter: (k: string) => boolean = skipKeys
		? 'size' in skipKeys
			? k => !skipKeys.has(k)
			: k => !skipKeys.includes(k)
		: _ => true;
	for (const key of Object.keys(from).filter(filter)) {
		const prop = from[key];
		if (prop !== void 0) try {
			to[key] = prop;
		} catch (cause) {
			throw Error('合并 ' + key + ' 错误');
		}
	}
}

/**
 * 用 id 获得元素并验证类型
 * @param id 元素 id
 * @param tag
 */
function gid<K extends gele.Tags>(id: string, tag: K): HTMLElementTagNameMap[K] {
	const ele = document.getElementById(id) ?? panic(getError('找不到:', id, tag));
	if (ele.tagName.toLowerCase() !== tag) panic(getError('错误的标签', id, tag, ele.tagName));
	return ele as any;
}

/**
 * 方便地获得一个元素
 * @param tag 元素的标签
 */
function gele<K extends gele.Tags, T extends gele.PropsMap<K>>(
	tag: K,
	props?: T,
): HTMLElementTagNameMap[K] & Dereadonly<typeof props> {
	const ele = document.createElement(tag);
	if (props === void 0) return ele as any;
	try {
		merge(props, ele, ['nodes', 'style']);
		props.nodes?.map(node => ele.appendChild(node));
		merge(props.style, ele.style);
	} catch (error) {
		panic(Error('无法创建元素', { cause: { error, tag, props } }));
	}
	return ele as any;
}
namespace gele {
	export type Tags = keyof HTMLElementTagNameMap;
	interface OtherOption {
		nodes: readonly HTMLElement[];
		style: Readonly<Partial<CSSStyleDeclaration>>;
	}
	interface PartOtherOption extends Readonly<Partial<OtherOption>> { }
	export type PropsMap<K extends Tags>
		= Readonly<Partial<Omit<HTMLElementTagNameMap[K], keyof OtherOption>>>
		& PartOtherOption
		& Record<string, unknown>;
}

/**
 * 获得任意东西的所有属性，包括原型链上的，但除了 `getAllProp.unchecks`
 * @param n 任意东西
 * @returns 包含所有属性的对象
 */
function getAllProp(n: unknown, depth = 10, stepped = new WeakSet<{}>()) {
	if (depth <= 0 || typeof n !== 'object' || n === null) return n;
	if (stepped.has(n)) return new getAllProp.CyclicError(n);
	stepped.add(n);
	const m = Object.create(null) as getAllProp.PropObj;
	const ori = n;
	while (n && !getAllProp.unchecks.has(n)) {
		getAllProp.getProp(n, m, ori, depth - 1, stepped);
		n = Reflect.getPrototypeOf(n);
	}
	return m;
}
namespace getAllProp {
	export type PropObj = Record<symbol | string, unknown>;
	export const unchecks = new Set([
		Object.prototype,
		Function.prototype,
		Array.prototype,
		HTMLElement.prototype,
	]);
	export class CyclicError extends Error {
		constructor(obj: {}) {
			super('Had Cycle!', { cause: obj });
		}
	}
	class PropError extends Error {
		constructor(name: keyof PropObj, e: unknown) {
			const cause = JSON.stringify(e instanceof Error ? e.message : e);
			const msg = `can't get ${name.toString()} cause ${cause}`;
			super(msg, { cause });
		}
	}
	export function getProp(n: any, m: PropObj, ori: any, depth: number, stepped: WeakSet<{}>) {
		for (const name of Reflect.ownKeys(n)) {
			if (name in m && !(m[name] instanceof PropError)) continue;
			try {
				const d = Reflect.getOwnPropertyDescriptor(n, name);
				const v = !d ? n[name] : d.get ? d.get.call(ori) : d.value;
				m[name] = getAllProp(v, depth, stepped);
			} catch (e) {
				m[name] = new PropError(name, e);
			}
		}
	}
}
function stringifyAll(n: unknown, depth?: number) {
	try {
		return JSON.stringify(getAllProp(n, depth), null, 2);
	} catch (err) {
		console.log(n);
		throw err;
	}
}

/**
 * 字符串拼出错误
 * @param infos 错误信息
 */
function getError(...infos: Tostrable[]) {
	return Error(infos.join('\n'));
}

function thr(error: unknown): never {
	throw error;
}

/**
 * 显示大红色错误页面并终止
 * @param error 错误信息
 */
function panic(error: Error, from = panic.From.Frontend): never {
	if (!error) panic(Error('没有提供错误'));
	panic.setFrom(from);
	panic.uncatchedMem.add(error);
	panic.errors.add(error);
	panic.show();
	panic.createPage();
	throw error;
}
namespace panic {
	const spanCache = gele('span');
	export enum From {
		Frontend = '页面',
		Backend = '后台',
		Both = '页面和后台',
	}
	let fromNow: From | null = null;
	export function setFrom(from: From) {
		if (fromNow && fromNow !== from) from = From.Both;
		fromNow = spanCache.innerText = from;
	}
	const preCache = gele('pre');
	export const errors = new Set<Error>();
	export function show() {
		preCache.innerText = Array.from(errors
			.values())
			.flatMap(err => [err, stringifyAll(err)])
			.join('\n');
	}
	let created = false;
	export function createPage() {
		if (created) return;
		created = true;
		const div = gele('div', {
			nodes: [
				gele('h1', {
					nodes: [
						gele('span', { innerText: '我的天啊，' }),
						spanCache,
						gele('span', { innerText: '出问题了！' }),
					],
				}),
				gele('hr', { color: '#fff' }),
				gele('p', { innerText: '请你带着以下错误报告向管理员汇报，或者重试一下？' }),
				preCache,
			],
			id: 'wrong_div',
		});
		const box = document.body ?? document.head.parentNode?.appendChild(gele('body'));
		box.insertBefore(div, box.firstChild);
	}
	export const uncatchedMem = new Set<Error | string | Promise<unknown>>();
	function onerror(
		event: Event | string,
		source = '未知代码',
		colno = 999,
		lineno = 999,
		error?: Error | string,
		message = '没提示',
	) {
		const catched = Error('未捕获的错误', { cause: { event, source, colno, lineno, error, message } });
		error ??= `${message} ${source} ${lineno} ${colno}`;
		if (uncatchedMem.has(error)) return;
		uncatchedMem.add(error);
		panic(catched);
	}
	window.onerror = onerror;
	window.addEventListener('error', event => {
		const { error, message, colno, lineno, filename } = event;
		onerror(event, filename, colno, lineno, error, message);
	});
	window.addEventListener('unhandledrejection', ({ promise, reason }) => {
		if (uncatchedMem.has(promise)) return;
		const catched = Error('未捕获的异步错误', { cause: reason });
		uncatchedMem.add(promise);
		panic(catched);
	});
}

/**当前所在的 script 标签 */
const eleNow = document.currentScript ?? panic(Error('拿不到当前所在 script 标签'));

if (!('mods' in globalThis)) {
	const insJs = (src: string) => {
		const modsEle = document.createElement('script');
		modsEle.src = src;
		eleNow.parentNode?.insertBefore(modsEle, eleNow);
		return modsEle;
	};
	insJs('/public/dist/mods.js').onload = () => insJs('main.js');
}

/**
 * 用 wrong 函数包装可能报错的操作
 * @param fn 可能报错的操作
 * @returns 操作结果
 */
function panicable<T>(fn: () => T): T {
	try {
		return fn();
	} catch (error) {
		if (error instanceof Error) panic(error);
		else panic(Error('不是错误', { cause: error }));
	}
}

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
