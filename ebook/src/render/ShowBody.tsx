import clsx from 'clsx';
import { Fragment, JSX, useState } from 'react';
import { Serialized } from '../storage';
import Header from './Header';
import ShowBodyText from './ShowBodyText';

export default function ShowBody({ serialized, hidden }: {
	serialized: Serialized;
	hidden: boolean;
}): JSX.Element {
	const [showing, setShowing] = useState(-1);

	if (serialized.part === 'Page') {
		return <ShowBodyText html={serialized.html} hidden={hidden} />;
	}

	const { sum, content } = serialized;
	return <>
		<ShowBody serialized={sum} hidden={hidden || showing !== -1} />
		{
			content.map(([header, body], idx) => <ShowBody serialized={body} hidden={hidden || showing !== idx} key={header} />)
		}
		<div className={clsx('show_body', 'show_body_header_box')} hidden={hidden || !content.length}>
			{content.map(([header], idx) => <Fragment key={header}>
				<Header
					header={header}
					hidden={idx !== showing}
					show={() => setShowing(showing === idx ? -1 : idx)}
				/>
				<hr />
			</Fragment>)}
		</div>
	</>;
}
