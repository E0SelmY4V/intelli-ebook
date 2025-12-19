/// <reference path="../public/common.ts" />

const findedObjType = z.object({
	id: z.string(),
	uid: z.string(),
	update_time: z.string(),
	fid: z.string(),
});

initCallbackHandler({
	start: [noForm, () => {
		const cid = query.get('cid') ?? panic(Error('不知道用户要看什么章节'));
		gid('find_cid_input', 'input').value = cid;
		gid('find_submit_input', 'input').click();
	}],
	finded: ['main', render],
}, {
	finded: [findedObjType],
});

/**
 * @param {z.infer<typeof findedObjType>} finded
 */
async function render({ fid }) {
	const res = await forceReq(`/api/upload/files/${fid}/index.json`);
	const content = await res.json();
	console.log(content);
}

