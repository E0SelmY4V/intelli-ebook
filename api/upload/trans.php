<?php

if (empty($_FILES)) die(); // 没文件
[$file] = $_FILES;

require './dir.php';

if (!session_start()) die(); // 用不了 session

$_SESSION['upload_name'] = 'hh';

$input = [
	(int)get($_POST, 'resumableChunkNumber', 0),
	(int)get($_POST, 'resumableTotalChunks', 0),
	(int)get($_POST, 'resumableTotalSize', 0),
	get($_POST, 'resumableIdentifier', ''),
	get($_SESSION, 'upload_name', ''),
];
if (!all($input)) die(); // 缺输入
[$no, $total_no, $total_size, $id, $name] =  $input;

$temp_dir = "$temp_root/$id";
if (!is_dir($temp_dir) && !mkdir($temp_dir, 0777, true)) die(); // 创建不了文件夹

$file_path  = "$temp_dir/$no.part";
if (!move_uploaded_file($file['tmp_name'], $file_path)) die(); // 没法拿到文件

$scaned = scandir($temp_dir);
if (!$scaned || count($scaned) !== $total_no) die(); // 文件不够

$now_size = 0;
foreach ($scaned as $t) $now_size += filesize("$temp_dir/$t");
if ($now_size < $total_size) die(); // 数据少了

if (($fp = fopen("$file_dir/$name", 'w')) === false) die(); // 无法创建最终文件

for ($i = 1; $i <= $total_no; $i++) {
	$file_now = "$temp_dir/chunk.pard$i";
	fwrite($fp, file_get_contents("$temp_dir/chunk.part$i"));
	unlink($file_now);
}
fclose($fp);
unlink($temp_dir);
