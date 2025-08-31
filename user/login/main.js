/// <reference path="../../public/common.js" />

const callback = JSON.parse(query.get('info') ?? '["ready"]');

function showForm(id) {
	Array
		.from(document.getElementsByName('sign_div'))
		.find(n => n.dataset.step === id.toString())
		.hidden = false;
}
/**@type {Record<string, [number, ([string, string] | (() => void))?]>} */
const cbs = {
	ready: [0, () => status_check_input.click()],
	start: [0],
	succ: [1, () => {
		const uid = callback[1] ?? wrong('缺少用户编号');
		id_a.innerHTML = uid;
	}],
	no_id: [0, ["没输账号", "请重输"]],
	no_password: [0, ['密码不能为空', '请重输']],
	no_user: [0, ['找不到此用户', '请检查你的邮箱或用户名是否正确']],
	wrong_password: [0, ['密码错误', '请重输']],
};
function idleCb() {
	const [formId, info] = cbs[callback[0]] ?? wrong(Error('未知回调代码: ' + query.get('info')));
	showForm(formId);
	if (typeof info === 'function') info();
	else if (info) showInfo(...info);
}

setOnload(idleCb);

