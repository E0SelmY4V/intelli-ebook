/// <reference path="../../public/common.js" />

setOnload(new CallbackHandler({
	ready: [0, () => status_check_input.click()],
	start: [0],
	succ: [1, ([uid]) => {
		id_a.innerHTML = uid ?? wrong('缺少用户编号');
	}],
	no_id: [0, ["没输账号", "请重输"]],
	no_password: [0, ['密码不能为空', '请重输']],
	no_user: [0, ['找不到此用户', '请检查你的邮箱或用户名是否正确']],
	wrong_password: [0, ['密码错误', '请重输']],
}, 'ready').handle);

