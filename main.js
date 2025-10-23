/// <reference path="public/common.ts" />

setOnload(() => {
	const r = new mods.Resumable({
		target: 'api/upload/trans.php',
		// @ts-ignore
		testTarget: 'api/upload/check.php',
		chunkSize: 800 * 1024, // 800 KB
		forceChunkSize: true,
		simultaneousUploads: 10,
		testChunks: true,
	});

	r.assignBrowse(gid('upBtn', 'button'), false);

	r.on('fileAdded', () => {
		// 文件选好立即开始
		gid('msg', 'div').innerText = '开始上传…';
		r.upload();
	});
	r.on('progress', () => {
		const p = Math.floor(r.progress() * 100);
		gid('percent', 'div').style.width = p + '%';
	});
	r.on('complete', () => {
		gid('msg', 'div').innerText = '上传完成！';
	});
	gid('pauseBtn', 'button').onclick = () => {
		r.pause(); // 再点一次会继续
	};
});

