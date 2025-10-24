/// <reference path="../public/common.ts" />

const findedObjType = Type.Object({
	id: Type.String(),
	uid: Type.String(),
	update_time: Type.String(),
	fid: Type.String(),
});

initCallbackHandler({
	start: [noForm],
	finded: ['main', render],
}, {
	finded: [findedObjType],
});

/**
 * @param {Type.Static<typeof findedObjType>} finded
 */
async function render({ fid }) {
	const res = await req(`/api/upload/files/${fid}/index.json`);
	const content = await res.json();
	console.log(content);
}

