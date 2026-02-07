import clsx from 'clsx';
import { imgFolder, MathJaxRendererContext } from './render';
import { use, useEffect, useRef } from 'react';

/**
 * 得到内容 show_body
 * @param blocks 内容的 Pandoc
 */
export default function ShowBodyText({ html, hidden }: {
	html: string;
	hidden: boolean;
}) {
	const contentRef = useRef<null | HTMLDivElement>(null);
	const mathJaxRenderer = use(MathJaxRendererContext);

	useEffect(() => {
		if (!contentRef.current) panic(Error('React Ref 导致显示不出内容'));
		contentRef.current.innerHTML = html.replaceAll('src="', `src=${imgFolder}`);
		mathJaxRenderer.add(
			Array.from(contentRef
				.current
				.children)
				.flatMap(n => Array.from(n.querySelectorAll('.math'))),
		);
	}, []);

	return (
		<div
			className={clsx('show_body', 'show_body_text', 'typobox')}
			hidden={hidden}
			style={{ display: clsx(hidden && 'none') }}
		>
			<div className='typo' ref={contentRef} />
		</div >
	);
}

