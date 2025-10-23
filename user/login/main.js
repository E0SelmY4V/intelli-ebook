/// <reference path="../../public/common.ts" />


initCallbackHandler({
	start: ['login', () => gid('status_check_input', 'input').click()],
	checked: ['login'],
	succ: ['logout', ([uid]) => {
		gid('id_a', 'a').innerHTML = uid ?? wrong(Error('缺少用户编号'));
	}],
	no_id: ['login', ['没输账号', '请重输']],
	no_password: ['login', ['密码不能为空', '请重输']],
	no_user: ['login', ['找不到此用户', '请检查你的邮箱或用户名是否正确']],
	wrong_password: ['login', ['密码错误', '请重输<br /><br />忘记密码可通过<a href="/user/signup/">此处</a>重置']],
});

