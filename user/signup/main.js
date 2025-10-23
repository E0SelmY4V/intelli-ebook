/// <reference path="../../public/common.ts" />

initCallbackHandler({
	start: ['email'],
	no_email: ['email', ['没输邮箱', '请重输']],
	wrong_email: ['email', ([email]) => showInfo('邮箱格式错误', `<code>${email ?? wrong(Error('缺少邮箱信息'))}</code> 不是一个有效的邮箱`)],
	email_failed: ['email', ([info]) => showInfo('邮件发送失败', '请你重新获取邮件<br />错误代码: <pre>' + info + '</pre>')],
	code_send: ['code'],
	code_droped: ['email', ['代码未发送', '请你重新获取邮件']],
	no_code: ['code', ['没输代码', '请重输']],
	code_exped: ['email', ['代码已过期', '请你重新获取邮件']],
	wrong_code: ['code', ['代码错误', '请再次输入']],
	signup: ['signup'],
	findback: ['findback', ([{ name, signup_time: signupDate }]) => {
		signupDate = new Date(signupDate);
		gid('find_name_code', 'code').innerText = name;
		gid('find_time_span', 'span').innerText = signupDate.toString();
	}],
	code_unsucc: ['email', ['没验证邮箱', '请先验证邮箱后再操作']],
	no_username: ['signup', ['没输用户名', '请重输']],
	long_username: ['signup', ['用户名太长', '太长了，重输']],
	had_name: ['signup', ['用户名重复', '已经有人叫这个名字了，请重输']],
	no_password: [cbForm, ['密码不能为空', '请重输']],
	wrong_password: [cbForm, ['两次密码不相同', '请重输']],
	succ: ['ok', ([uid]) => {
		gid('id_a', 'a').innerHTML = uid ?? wrong(Error('缺少用户编号'));
	}],
});

