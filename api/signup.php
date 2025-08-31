<?php

require_once __DIR__ . '/../scpo-php/db.php';
require_once __DIR__ . '/../scpo-php/errpage.php';
require_once __DIR__ . '/../scpo-php/email.php';
require_once __DIR__ . '/../scpo-php/str.php';
require_once __DIR__ . '/config.php';

use ScpoPHP\Db as Db;
use ScpoPHP\Str as Str;

[$ret, $end] = ScpoPHP\Errpage::get_ret('api/signup.php', $_POST['from_input']);

if (!session_start()) $ret('服务端无法使用 session');

switch ($_POST['step']) {
	case 0:
		if (!($email = $_POST['email'])) $end('["no_email"]');
		if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $end(json_encode(['wrong_email', $email]));
		if ($name = Db::select(['email' => $email], 'name', 'users')) $end(json_encode(['had_email', $name[0][0]]));
		if (!isset($_SESSION['signup_code_exp']) || $_SESSION['signup_code_exp'] < time()) {
			$_SESSION['signup_code_exp'] = time() + 60 * 15;
			$_SESSION['signup_code'] = Str::rand(6);
		}
		if (
			!ScpoPHP\Email::send(
				'您的邮箱验证码',
				"您的邮箱验证码为<h1>{$_SESSION['signup_code']}</h1>若您没有在尝试注册农大智能电子教材网，请忽略这封邮件",
				$email
			)
		) $end('["email_failed"]');
		$_SESSION['signup_email'] = $email;
		$end('["code_send"]');
	case 1:
		if (!isset($_SESSION['signup_code'])) $end('["code_droped"]');
		if (!($code = $_POST['code'])) $end('["no_code"]');
		if (!isset($_SESSION['signup_code_exp'])) $ret('未知的代码过期时间');
		if ($_SESSION['signup_code_exp'] < time()) $end('["code_exped"]');
		if (strtoupper($code) !== $_SESSION['signup_code']) $end('["wrong_code"]');
		$_SESSION['signup_code_succ'] = true;
		$end('["true_code"]');
	case 2:
		if (!($name = $_POST['username'])) $end('["no_username"]');
		if (strlen($name) > 250) $end('["long_username"]');
		if (!($pw = $_POST['password_1'])) $end('["no_password"]');
		if ($pw !== $_POST['password_2']) $end('["wrong_password"]');
		if (!$_SESSION['signup_code_succ']) $end('["code_unsucc"]');
		if (!isset($_SESSION['signup_code_exp'])) $ret('未知的代码过期时间');
		if ($_SESSION['signup_code_exp'] < time()) $end('["code_exped"]');
		$salt = Str::bin2str(Str::hex2bin(Str::rand(20)));
		$hashed_pw = hash('sha256', $pw . $salt, true);
		if (Db::select(['name' => $name], 'id', 'users')) $end('["had_name"]');
		$uid = $_SESSION['uid'] = Db::insert([
			'name' => $name,
			'password' => $hashed_pw,
			'salt' => $salt,
			'email' => $_SESSION['signup_email'],
		], 'users', true);
		$end("[\"succ\", $uid]");
	default:
		$ret('当前进行到注册的第几步了？');
}
