/// <reference path="../../public/common.js" />

const callback = JSON.parse(query.get('info') ?? '["start"]');

function showForm(id) {
	Array
		.from(document.getElementsByName('sign_div'))
		.find(n => n.dataset.step === id.toString())
		.hidden = false;
}
/**@type {Record<string, [number, ([string, string] | (() => void))?]>} */
const cbs = {
	start: [0],
	no_email: [0, ["没输邮箱", "请重输"]],
	wrong_email: [0, () => showInfo("邮箱格式错误", `<code>${callback[1] ?? wrong('缺少邮箱信息')}</code> 不是一个有效的邮箱`)],
	email_failed: [0, ['邮件发送失败', '请你重新获取邮件']],
	had_email: [0, () => showInfo('邮箱已注册', `这个邮箱已经绑定了账号 <code>${callback[1] ?? wrong('缺少账号信息')}</code>`)],
	code_send: [1],
	code_droped: [0, ['代码未发送', '请你重新获取邮件']],
	no_code: [1, ['没输代码', '请重输']],
	code_exped: [0, ['代码已过期', '请你重新获取邮件']],
	wrong_code: [1, ["代码错误", '请再次输入']],
	true_code: [2],
	code_unsucc: [0, ['没验证邮箱', '请先验证邮箱后再操作']],
	no_username: [2, ['没输用户名', '请重输']],
	no_password: [2, ['密码不能为空', '请重输']],
	long_username: [2, ['用户名太长', '太长了，重输']],
	wrong_password: [2, ['两次密码不相同', '请重输']],
	had_name: [2, ['用户名重复', '已经有人叫这个名字了，请重输']],
	succ: [3, () => {
		const uid = callback[1] ?? wrong('缺少用户编号');
		id_a.innerHTML = uid;
	}],
};
function idleCb() {
	const [formId, info] = cbs[callback[0]] ?? wrong(Error('未知回调代码: ' + query.get('info')));
	showForm(formId);
	if (typeof info === 'function') info();
	else if (info) showInfo(...info);
}

setOnload(idleCb);

