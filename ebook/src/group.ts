import Block = PandocTypes.Block;
import Header = PandocTypes.Header;

/**
 * 给块按照 `level` 级标题分组
 * @param blocks 一堆文档块
 * @param level 当前分到多少级标题
 * @returns `sum` 是这堆文档块开头不属于任何标题的内容， `groups` 是每个标题及对应的内容
 */
function groupify(blocks: Block[], level: number) {
	const sum: Block[] = [];
	let grouping: Block[] | null = null;
	const groups: [Header, Block[]][] = [];
	for (const block of blocks) {
		if (block.t !== 'Header' || block.c[0] > level) {
			if (block.t === 'Header') block.c[0] -= 1;
			(grouping ?? sum).push(block);
			continue;
		}
		if (block.c[0] < level) panic(getError('解析等级小于内容等级', level, block, blocks));
		grouping = [];
		groups.push([block, grouping]);
	}
	return { sum, groups };
}

/**分完组的书 */
export type GroupedBook = Grouped | Block[];
/**被拆分的部分 */
export interface Grouped {
	/**最前头不属于任何标题的内容 */
	sum: Block[];
	/**之后的每级标题及内容 */
	content: Map<Header, GroupedBook>;
}
/**
 * 分组整个文章
 * @param blocks 文章的一堆块
 * @param least 最少分到第几级标题
 * @param levelStart 从第几级标题开始分
 */
export function groupifyAll(blocks: Block[], least: number, levelStart = 2): GroupedBook {
	if (levelStart > least) return blocks;
	const { sum, groups } = groupify(blocks, levelStart);
	return {
		sum,
		content: new Map(groups.map(
			([header, blocks]) => [header, groupifyAll(blocks, least - 1, levelStart)],
		)),
	};
}
