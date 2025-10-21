<?php

if (!isset($_FILES['file'])) die('没文件');
$file = $_FILES['file'];

require __DIR__ . '/dir.php';

if (!session_start()) die('用不了 session');

$input = [
	(int)get($_POST, 'resumableChunkNumber', 0),
	(int)get($_POST, 'resumableTotalChunks', 0),
	(int)get($_POST, 'resumableTotalSize', 0),
	get($_POST, 'resumableIdentifier', ''),
	get($_POST, 'resumableFilename', ''),
	get($_SESSION, 'fid', ''),
];
if (!all($input)) die('缺输入');
[$no, $total_no, $total_size, $id, $name, $fid] =  $input;

$temp_dir = TEMP_ROOT . "/$id";
if (!is_dir($temp_dir) && !mkdir($temp_dir, 0777, true)) die('创建不了临时文件夹');

$temp_path  = "$temp_dir/$no.part";
if (!move_uploaded_file($file['tmp_name'], $temp_path)) die('没法拿到文件');

$scaned = array_diff(scandir($temp_dir), ['.', '..']);
if (!$scaned || count($scaned) !== $total_no) die('文件不够');

// $now_size = 0;
// foreach ($scaned as $t) $now_size += filesize("$temp_dir/$t");
// if ($now_size < $total_size) die('数据少了');

$file_path = FILE_DIR . "/$fid/$name";
$file_dir = dirname($file_path);
if (!is_dir($file_dir) && !mkdir($file_dir, 0777, true)) die('创建不了最终文件夹');

if (($fp = fopen($file_path, 'w')) === false) die('无法创建最终文件');

for ($i = 1; $i <= $total_no; $i++) {
	$temp_now = "$temp_dir/$i.part";
	fwrite($fp, file_get_contents($temp_now));
	unlink($temp_now);
}
fclose($fp);
rmdir($temp_dir);
