import { Suspense, use } from 'react';
import { Serialized } from '../storage';
import ShowBody from './ShowBody';

export function NonWaitingView({ serializedPromise }: {
	serializedPromise: Promise<Serialized>;
}) {
	const serialized = use(serializedPromise);
	return <ShowBody serialized={serialized} hidden={false} />;
}

export default function View({ serializedPromise }: {
	serializedPromise: Promise<Serialized>;
}) {
	return (
		<Suspense fallback={<h1>正在加载</h1>}>
			<NonWaitingView serializedPromise={serializedPromise} />
		</Suspense>
	);
}
