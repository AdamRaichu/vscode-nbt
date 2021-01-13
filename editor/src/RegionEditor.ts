import { NbtPath } from "./NbtPath";
import { TreeEditor } from "./TreeEditor";

export class RegionEditor extends TreeEditor {
  private chunks: any[]

  constructor(root: Element, private vscode: any) {
    super(root)
  }

  redraw() {
    this.content.innerHTML = this.drawRegion(new NbtPath(), this.chunks);
    this.addEvents()
  }

  update(data: any) {
    this.chunks = data.chunks
  }

  onMessage(type: string, body: any) {
    if (type === 'chunk') {
      const index = this.chunks.findIndex(c => c.x === body.x && c.z === body.z);
      this.chunks[index] = body;
      console.log(this.chunks)
			this.redraw();
    }
  }

  private drawRegion(path: NbtPath, chunks: any[]) {
    return chunks.map((c, i) => `<div>
			${this.drawChunk(path.push(i), c)}
		</div>`).join('')
  }

  private drawChunk(path: NbtPath, chunk: any) {
    const expanded = chunk.loaded && this.isExpanded(path);
    return `<div class="nbt-tag collapse">
      ${chunk.loaded ? this.drawCollapse(path, 'compound', chunk.data.value) : this.drawChunkExpand(path)}
      ${this.drawIcon('chunk')}
      <span class="nbt-key">Chunk [${chunk.x}, ${chunk.z}]</span>
    </div>
    <div class="nbt-body">
      ${expanded ? this.drawCompound(path, chunk.data.value) : ''}
    </div>`
  }

  private drawChunkExpand(path: NbtPath) {
    const click = this.on('click', () => {
      this.expand(path);
      this.vscode.postMessage({ type: 'getChunkData', index: path.last() })
    })
    return `<span class="nbt-collapse" ${click}>+</span>`;
  }
}