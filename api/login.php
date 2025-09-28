<?php

require_once __DIR__ . '/../scpo-php/db.php';
require_once __DIR__ . '/../scpo-php/errpage.php';
require_once __DIR__ . '/config.php';

use ScpoPHP\Db as Db;

[$ret, $end] = ScpoPHP\Errpage::get_ret('api/signup.php', $_POST['from']);

if (!session_start()) $ret('服务端无法使用 session');

switch ($_POST['step']) {
	case 'check':
		$end($_SESSION['uid'] ? "[\"succ\", {$_SESSION['uid']}]" : '["checked"]');
	case 'login':
		if (!($id = $_POST['id'])) $end('["no_id"]');
		if (!($pw = $_POST['password'])) $end('["no_password"]');
		$f = true;
		foreach (
			Db::select(
				[filter_var($id, FILTER_VALIDATE_EMAIL) ? 'email' : 'name' => $id],
				'id, password, salt',
				'users',
			) as [$uid, $hashed_pw, $salt]
		) {
			if (hash("sha256", $pw . $salt, true) !== $hashed_pw) {
				$f = false;
				continue;
			}
			$_SESSION['uid'] = $uid;
			$end("[\"succ\", $uid]");
		}
		if ($f) $end('["no_user"]');
		$end('["wrong_password"]');
	case 'logout':
		unset($_SESSION['uid']);
		$end('["checked"]');
	default:
		$ret('当前在登录还是登出？');
}
