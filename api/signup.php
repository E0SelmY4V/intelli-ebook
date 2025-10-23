<?php

require_once __DIR__ . '/../scpo-php/db.php';
require_once __DIR__ . '/../scpo-php/errpage.php';
require_once __DIR__ . '/../scpo-php/email.php';
require_once __DIR__ . '/../scpo-php/str.php';
require_once __DIR__ . '/config.php';

use ScpoPHP\Db as Db;
use ScpoPHP\Str as Str;

[$ret, $end] = ScpoPHP\Errpage::get_ret('api/signup.php', $_POST['from']);

if (!session_start()) $ret('服务端无法使用 session');

$check_exped = function () use ($ret, $end) {
	if (!isset($_SESSION['signup_code_exp'])) $ret('未知的代码过期时间');
	$signup_code_exp = $_SESSION['signup_code_exp'];
	if ($signup_code_exp < time()) $end(['code_exped']);
};
$check_code_succ = function () use ($end, $check_exped) {
	if (!$_SESSION['signup_code_succ']) $end(['code_unsucc']);
	$check_exped();
};
$check_pw = function ($where) use ($end) {
	if (!isset($_POST['password_1']) || !($pw = $_POST['password_1'])) $end([['no_password', $where]]);
	if (!isset($_POST['password_2']) || $pw !== $_POST['password_2']) $end([['wrong_password', $where]]);
	$salt = Str::bin2str(Str::hex2bin(Str::rand(20)));
	return [hash('sha256', $pw . $salt, true), $salt];
};
$check_email = function () use ($end) {
	if (!isset($_SESSION['signup_email'])) $end(['email_droped']);
	$signup_email = $_SESSION['signup_email'];
	if (!filter_var($signup_email, FILTER_VALIDATE_EMAIL)) $end(['wrong_email', $signup_email]);
	return $signup_email;
};

if (!isset($_POST['step'])) $ret('没带请求');

switch ($_POST['step']) {
	case 'email':
		if (!isset($_POST['email']) || !($signup_email = $_POST['email'])) $end(['no_email']);
		if (!filter_var($signup_email, FILTER_VALIDATE_EMAIL)) $end(['wrong_email', $signup_email]);

		if (!isset($_SESSION['signup_code_exp']) || $_SESSION['signup_code_exp'] < time()) {
			$_SESSION['signup_code_exp'] = time() + 60 * 15;
			$_SESSION['signup_code'] = Str::rand(6);
		}

		$n = ScpoPHP\Email::send(
			'您的邮箱验证码',
			"您的邮箱验证码为<h1>{$_SESSION['signup_code']}</h1>若您没有在农大智能电子教材网注册或找回密码，请忽略这封邮件",
			$signup_email
		);

		if ($n !== true) $end(['email_failed', $n]);

		$_SESSION['signup_email'] = $signup_email;

		$end(['code_send']);
	case 'code':
		if (!isset($_SESSION['signup_code'])) $end(['code_droped']);
		$signup_code = $_SESSION['signup_code'];

		$signup_email = $check_email();

		if (!isset($_POST['code']) || !($code = $_POST['code'])) $end(['no_code']);

		$check_exped();

		if (strtoupper($code) !== $signup_code) $end(['wrong_code']);
		$_SESSION['signup_code_succ'] = true;

		$r = Db::select(['email' => $signup_email], 'id, name, signup_time', 'users');

		if ($r) $_SESSION['uid'] = $r[0][0];

		$end($r ? ['findback', $r[0]] : ['signup']);
	case 'signup':
		$signup_email = $check_email();

		if (!isset($_POST['username']) || !($name = $_POST['username'])) $end(['no_username']);
		if (strlen($name) > 250) $end(['long_username']);

		$check_code_succ();

		if (Db::select(['name' => $name], 'id', 'users')) $end(['had_name']);

		[$hashed_pw, $salt] = $check_pw('signup');

		$uid = (int)$_SESSION['uid'] = Db::insert([
			'name' => $name,
			'password' => $hashed_pw,
			'salt' => $salt,
			'email' => $signup_email,
		], 'users', true);

		$end(['succ', $uid]);
	case 'findback':
		if (!($uid = $_SESSION['uid'])) $ret('当前重置的是哪个账号？');

		$check_code_succ();

		[$hashed_pw, $salt] = $check_pw('findback');

		Db::update(['password' => $hashed_pw, 'salt' => $salt], ['id' => $uid], 'users');

		$end(['succ', $uid]);
	default:
		$ret('当前进行到注册的第几步了？');
}
