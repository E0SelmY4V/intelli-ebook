import { createRoot } from 'react-dom/client';
import ShowBody from './ShowBody';
import { Serialized } from '../storage';

/**图片文件的位置 */
export const imgFolder = '/api/upload/files/';

export default function render(box: HTMLElement, serialized: Serialized) {
	createRoot(box).render(<ShowBody serialized={serialized} hidden={false} />);
}

