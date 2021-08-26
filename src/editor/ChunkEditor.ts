import type { NamedNbtTag } from 'deepslate'
import { getListTag, getOptional, getTag, Structure } from 'deepslate'
import { vec3 } from 'gl-matrix'
import { StructureEditor } from './StructureEditor'
import { toBigInt } from './Util'

export class ChunkEditor extends StructureEditor {
	
	onInit(data: NamedNbtTag) {
		this.updateStructure(data)
		vec3.copy(this.cPos, this.structure.getSize())
		vec3.mul(this.cPos, this.cPos, [-0.5, -1, -0.5])
		vec3.add(this.cPos, this.cPos, [0, 16, 0])
		this.cDist = 25
		this.showSidePanel()
		this.render()
	}

	protected loadStructure(data: NamedNbtTag) {
		this.gridActive = false

		const level = getTag(this.data.value, 'Level', 'compound')
		const sections = getOptional(() => getListTag(level, 'Sections', 'compound'), [])

		const filledSections = sections.filter(section =>
			section['Palette'] && getListTag(section, 'Palette', 'compound')
				.filter(state => getTag(state, 'Name', 'string') !== 'minecraft:air')
				.length > 0
		)
		const minY = 16 * Math.min(...filledSections.map(s => getTag(s, 'Y', 'byte')))
		const maxY = 16 * Math.max(...filledSections.map(s => getTag(s, 'Y', 'byte')))

		const structure = new Structure([16, maxY - minY + 16, 16])
		for (const section of filledSections) {
			if (!section['Palette'] || !section['BlockStates']) {
				continue
			}
			const yOffset = getTag(section, 'Y', 'byte') * 16 - minY
			const palette = getListTag(section, 'Palette', 'compound')
			const blockStates = getTag(section, 'BlockStates', 'longArray')

			const bits = Math.max(4, Math.ceil(Math.log2(palette.length)))
			const bitMask = BigInt(Math.pow(2, bits) - 1)
			const perLong = Math.floor(64 / bits)

			let i = 0
			let data = BigInt(0)
			for (let j = 0; j < 4096; j += 1) {
				if (j % perLong === 0) {
					data = toBigInt(blockStates[i])
					i += 1
				}
				const index = Number((data >> BigInt(bits * (j % perLong))) & bitMask)
				const state = palette[index]
				if (state) {
					const pos: [number, number, number] = [j & 0xF, yOffset + (j >> 8), (j >> 4) & 0xF]
					const name = getTag(state, 'Name', 'string')
					const properties = Object.fromEntries(
						Object.entries(getOptional(() => getTag(state, 'Properties', 'compound'), {}))
							.filter(([_, v]) => v.type === 'string')
							.map(([k, v]) => [k, v.value as string]))
					structure.addBlock(pos, name, properties)
				}
			}
		}
		return structure
	}

	menu() {
		return []
	}

	protected showSidePanel() {
		this.root.querySelector('.side-panel')?.remove()
		const block = this.selectedBlock ? this.structure.getBlock(this.selectedBlock) : null
		if (block) {
			super.showSidePanel()
		}
	}
}