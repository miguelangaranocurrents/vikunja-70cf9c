import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain text for the clipboard. ProseMirror's default joins every block with a blank
// line and drops list markers, so a copied list would paste as loose paragraphs.

function listItemMarker(list: ProseMirrorNode, item: ProseMirrorNode, index: number): string {
	switch (list.type.name) {
		case 'orderedList':
			return `${(list.attrs.start ?? 1) + index}. `
		case 'taskList':
			return `- [${item.attrs.checked ? 'x' : ' '}] `
		default:
			return '- '
	}
}

function listToText(list: ProseMirrorNode): string {
	const items: string[] = []
	list.forEach((item, _, index) => {
		const marker = listItemMarker(list, item, index)
		const indent = ' '.repeat(marker.length)
		const parts: string[] = []
		item.forEach(child => parts.push(nodeToText(child)))
		items.push(marker + parts.join('\n').split('\n').join('\n' + indent))
	})
	return items.join('\n')
}

function nodeToText(node: ProseMirrorNode): string {
	if (node.isTextblock) {
		return node.textBetween(0, node.content.size, '\n')
	}

	if (node.isLeaf) {
		return node.type.spec.leafText?.(node) ?? node.textContent
	}

	if (['bulletList', 'orderedList', 'taskList'].includes(node.type.name)) {
		return listToText(node)
	}

	return fragmentToText(node.content)
}

function fragmentToText(fragment: Fragment): string {
	if (fragment.firstChild?.isInline) {
		return fragment.textBetween(0, fragment.size, '\n\n')
	}

	const blocks: string[] = []
	fragment.forEach(node => blocks.push(nodeToText(node)))
	return blocks.join('\n\n')
}

export function serializeClipboardText(slice: Slice): string {
	return fragmentToText(slice.content)
}
