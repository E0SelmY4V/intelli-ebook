<?php

require_once __DIR__ . '/../scpo-php/db.php';
require_once __DIR__ . '/../scpo-php/errpage.php';
require_once __DIR__ . '/config.php';

use \ScpoPHP\Db as Db;

[$ret, $end] = ScpoPHP\Errpage::get_ret('api/upload.php', $_POST['from_input']);

if ($_FILES['doc']['error'] !== UPLOAD_ERR_OK) $ret('获取不到上传的文件');

$cid = Db::insert([
	'uid' => 1,
], 'metas', true);
if (!$cid) $ret('无法注册这个章节');

$tempFile = $_FILES['doc']['tmp_name'];
$targetFile = __DIR__ . '/../ebook/book_' . $cid;
if (!move_uploaded_file($tempFile, $targetFile)) $ret('无法移动临时文件');

$end(json_encode(['code' => 0, 'info' => $cid]));
